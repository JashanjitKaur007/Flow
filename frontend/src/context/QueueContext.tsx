import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Vibration } from "react-native";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner-native";
import { Queue, QueueStatus, Token } from "../models/types";
import { TokenManager } from "../services/api";
import QueueService from "../services/queueService";
import { TokenService } from "../services/token.service";
import { useAuth } from "./AuthContext";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface QueueContextType {
  isConnected: boolean;
  activeToken: Token | null;
  queueStatus: QueueStatus | null;
  queue: Queue | null; // Current queue for staff/admin
  isLoading: boolean;
  error: string | null;
  // Staff queue management states
  isCallingNext: boolean;
  isCompleting: boolean;
  // Computed UI states
  currentServingNumber: string | number;
  totalPatientsInQueue: number;
  hasNoPatients: boolean;
  hasActiveToken: boolean;
  isTokenCompleted: boolean;
  showCompleteButton: boolean;
  showNoButtons: boolean;
  // Functions
  joinQueue: (token: Token) => void;
  leaveQueue: () => Promise<void>;
  generateTokenForClinic: (clinicId: string) => Promise<Token | null>;
  refreshActiveToken: () => Promise<void>;
  reconnectSocket: () => Promise<void>;
  callNextTocken: () => Promise<void>;
  completeCurrentToken: () => Promise<void>;
  refreshQueueStatus: () => Promise<void>;
  refreshQueue: () => Promise<Queue | null>;
  joinStaffQueueRoom: (queueId: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType>({} as QueueContextType);

export const QueueProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null); // Current queue for staff/admin
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Staff queue management states
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const isRefreshingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const activeTokenRef = useRef<Token | null>(null);

  useEffect(() => {
    activeTokenRef.current = activeToken;
  }, [activeToken]);

  const refreshAuthToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshingRef.current) return null;
    isRefreshingRef.current = true;

    try {
      const refreshToken = await TokenManager.getRefreshToken();
      if (!refreshToken) {
        console.log("No refresh token available");
        return null;
      }

      console.log("Refreshing auth token for socket...");
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
        deviceInfo: { userAgent: "flowClinics-Mobile-App" },
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await TokenManager.setTokens(accessToken, newRefreshToken);
      console.log("Token refreshed successfully");
      return accessToken;
    } catch (err) {
      console.error("Failed to refresh token:", err);
      await TokenManager.clearTokens();
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const initSocket = useCallback(
    async (authToken?: string) => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const token = authToken || (await TokenManager.getAccessToken());

      if (!token) {
        console.log("No auth token, skipping socket connection");
        return;
      }

      console.log("Initializing socket connection...");
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        autoConnect: true,
      });

      newSocket.on("connect", async () => {
        console.log("Socket connected:", newSocket.id);
        setIsConnected(true);
        setError(null);

        // For staff/admin users, automatically join their clinic's queue room on login
        // Only if queue is active
        if (
          user &&
          (user.role === "STAFF" || user.role === "ADMIN") &&
          user.clinicId
        ) {
          try {
            const queue = await QueueService.getTodayQueueForClinic(
              user.clinicId
            );
            if (queue) {
              setQueue(queue);
              // Only join socket if queue is active
              if (queue.isActive) {
                console.log(
                  "Staff/Admin auto-joining queue room on login:",
                  queue.id
                );
                newSocket.emit("join-queue", queue.id);
              } else {
                console.log("Queue is not active, skipping socket join");
              }
            }
          } catch (error) {
            console.error("Failed to auto-join queue room on connect:", error);
          }
        }

        // Refresh active token when socket connects
        await refreshActiveToken();
      });

      newSocket.on("disconnect", async (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);

        const isServerDisconnect =
          reason === "io server disconnect" || reason === "transport close";

        if (
          isServerDisconnect &&
          socketRef.current &&
          !isRefreshingRef.current
        ) {
          console.log(
            "Server disconnected, attempting token refresh and reconnect..."
          );
          const newToken = await refreshAuthToken();
          if (newToken) {
            await initSocket(newToken);
          } else {
            setError("Authentication expired. Please log in again.");
          }
        }
      });

      newSocket.on("connect_error", async (err) => {
        console.log("Socket connection error:", err.message);
        setIsConnected(false);

        const isAuthError =
          err.message.includes("auth") ||
          err.message.includes("unauthorized") ||
          err.message.includes("jwt") ||
          err.message.includes("token");

        if (isAuthError && !isRefreshingRef.current) {
          console.log("Auth error detected, attempting token refresh...");
          const newToken = await refreshAuthToken();
          if (newToken && socketRef.current) {
            console.log("Reconnecting socket with new token...");
            socketRef.current.auth = { token: newToken };
            socketRef.current.connect();
          } else {
            setError("Authentication failed. Please log in again.");
          }
        } else if (!isAuthError) {
          setError("Connection failed");
        }
      });

      newSocket.on("join-queue", () => {
        console.log("Successfully joined queue room");
      });

      newSocket.on("join-queue-error", (message: string) => {
        console.error("Failed to join queue:", message);
        setError(message);
      });

      newSocket.on("leave-queue", () => {
        console.log("Left queue room");
      });

      newSocket.on("queue:status_update", (status: QueueStatus) => {
        console.log("Queue status update:", status);
        setQueueStatus(status);
      });

      newSocket.on("queue:empty", (message: string) => {
        console.log("Queue empty:", message);
        toast.info("Queue is empty. Please wait for the next patient to join.");
      });

      newSocket.on("queue:your_token_called", (updatedToken: Token) => {
        console.log("Your token was called!");
        setActiveToken(updatedToken);
        Vibration.vibrate([0, 500, 200, 500]);
        toast.info(
          `🎉 Your Turn! \n Token #${updatedToken.tokenNumber} has been called. Please proceed to the counter.`
        );
      });

      newSocket.on("queue:your_token_skipped", (updatedToken: Token) => {
        console.log("Your token was skipped");
        // Clear the active token when skipped - patient is removed from queue
        setActiveToken(null);
        setQueueStatus(null);
        toast.info(
          "Your token has been skipped. Please contact the staff if this was a mistake."
        );
      });

      newSocket.on("queue:your_token_completed", () => {
        console.log("Your token was completed");
        setActiveToken(null);
        setQueueStatus(null);
        toast.info("Thank you for your visit! Please come back soon.");
      });

      newSocket.on("queue:your_token_updated", (updatedToken: Token) => {
        console.log("Your token was updated");
        setActiveToken(updatedToken);
        toast.info(
          `Your token number has been updated to #${updatedToken.tokenNumber}`
        );
      });

      socketRef.current = newSocket;
    },
    [refreshAuthToken, user]
  );

  const reconnectSocket = useCallback(async () => {
    console.log("Manual socket reconnection requested");
    await initSocket();
  }, [initSocket]);

  // Initialize socket when user is authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If user is authenticated and socket not initialized, initialize it
    if (user && !isInitializedRef.current) {
      console.log("User authenticated, initializing socket...");
      isInitializedRef.current = true;
      initSocket();
    }

    // If user is not authenticated, disconnect and reset
    if (!user && isInitializedRef.current) {
      console.log("User logged out, disconnecting socket...");
      isInitializedRef.current = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setActiveToken(null);
      setQueueStatus(null);
      setError(null);
    }
  }, [user, authLoading, initSocket]);

  // Auto-join queue room for staff/admin when user is set and socket is connected
  // Only if queue is active
  useEffect(() => {
    const joinQueueIfNeeded = async () => {
      if (!user || !isConnected || !socketRef.current?.connected || authLoading)
        return;

      // Only for staff/admin users with clinicId
      if ((user.role === "STAFF" || user.role === "ADMIN") && user.clinicId) {
        try {
          const queue = await QueueService.getTodayQueueForClinic(
            user.clinicId
          );
          if (queue) {
            setQueue(queue);
            // Only join socket if queue is active
            if (queue.isActive) {
              console.log("Staff/Admin auto-joining queue room:", queue.id);
              socketRef.current?.emit("join-queue", queue.id);
            } else {
              console.log("Queue is not active, skipping socket join");
            }
          }
        } catch (error) {
          console.error("Failed to auto-join queue room:", error);
        }
      }
    };

    joinQueueIfNeeded();
  }, [user, isConnected, authLoading]);

  // Watch for queue.isActive changes and join/leave socket room accordingly
  // Only for staff/admin users
  useEffect(() => {
    const handleQueueStatusChange = async () => {
      // Only run for staff/admin users
      if (
        !user ||
        (user.role !== "STAFF" && user.role !== "ADMIN") ||
        !isConnected ||
        !socketRef.current?.connected ||
        authLoading
      )
        return;

      // Only proceed if user has clinicId and queue exists
      if (user.clinicId && queue) {
        if (queue.isActive) {
          // Queue became active, join the room
          console.log("Queue activated, joining socket room:", queue.id);
          socketRef.current.emit("join-queue", queue.id);
        } else {
          // Queue became inactive, leave the room
          console.log("Queue paused, leaving socket room:", queue.id);
          socketRef.current.emit("leave-queue", queue.id);
        }
      }
    };

    handleQueueStatusChange();
  }, [queue?.isActive, user, isConnected, authLoading, queue?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinQueue = useCallback((token: Token) => {
    setActiveToken(token);
    setError(null);

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("join-queue", token.queueId);
    }
  }, []);

  const leaveQueue = useCallback(async () => {
    const socket = socketRef.current;
    const token = activeTokenRef.current;

    if (socket?.connected && token) {
      socket.emit("leave-queue", token.queueId);
    }

    if (token) {
      try {
        await TokenService.cancelToken(token.id);
      } catch (err) {
        console.warn("Failed to cancel token via API:", err);
      }
    }

    setActiveToken(null);
    setQueueStatus(null);
  }, []);

  const generateTokenForClinic = useCallback(
    async (clinicId: string): Promise<Token | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await TokenService.generateTokenForClinic(clinicId);
        console.log("Generated token:", token);
        joinQueue(token);
        return token;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate token";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [joinQueue]
  );

  const refreshActiveToken = useCallback(async () => {
    try {
      if (!user) return;

      // Only refresh active token for patients (staff/admin don't have active tokens)
      if (user.role !== "PATIENT") {
        return;
      }

      console.log("Refreshing active token...");
      const token = await TokenService.getMyActiveTokens(user.id);
      if (token) {
        console.log("Found active token:", token);
        setActiveToken(token);

        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit("join-queue", token.queueId);
        }
      } else {
        console.log("No active tokens found");
        setActiveToken(null);
      }
    } catch (err) {
      console.error("Failed to refresh active token:", err);
    }
  }, [user]);

  const joinStaffQueueRoom = useCallback(
    async (queueId: string): Promise<void> => {
      const socket = socketRef.current;
      if (!socket?.connected) return;

      // Check if queue is active before joining
      try {
        const queueData = await QueueService.getTodayQueueForClinic(
          user?.clinicId || ""
        );
        if (queueData) {
          setQueue(queueData);
          if (queueData.isActive) {
            console.log("Staff joining queue room:", queueId);
            socket.emit("join-queue", queueId);
          } else {
            console.log("Queue is not active, skipping socket join");
          }
        }
      } catch (error) {
        console.error("Failed to check queue status:", error);
      }
    },
    [user?.clinicId]
  );

  const refreshQueue = useCallback(async (): Promise<Queue | null> => {
    try {
      if (!user?.clinicId || user.role === "PATIENT") return null;

      const queueData = await QueueService.getTodayQueueForClinic(
        user.clinicId
      );
      if (queueData) {
        setQueue(queueData);
        return queueData;
      } else {
        setQueue(null);
        return null;
      }
    } catch (err) {
      console.error("Failed to refresh queue:", err);
      return null;
    }
  }, [user?.clinicId, user?.role]);

  const refreshQueueStatus = useCallback(async () => {
    try {
      if (!user?.clinicId) return;

      const queue = await refreshQueue();
      if (!queue) {
        setQueueStatus(null);
        return;
      }

      const status = await QueueService.getQueueStatus(queue.id);
      if (status) {
        // Only log if status actually changed to reduce noise
        const statusChanged =
          queueStatus?.waitingCount !== status.waitingCount ||
          queueStatus?.currentTokenNo !== status.currentTokenNo ||
          queueStatus?.lastServedTokenNumber !== status.lastServedTokenNumber;

        if (statusChanged) {
          console.log("Refreshed queue status:", status);
        }
        setQueueStatus(status);
      } else {
        setQueueStatus(null);
      }
    } catch (err) {
      console.error("Failed to refresh queue status:", err);
    }
  }, [user?.clinicId, refreshQueue, queueStatus]);

  const callNextTocken = useCallback(async () => {
    try {
      if (
        !user ||
        (user.role !== "ADMIN" && user.role !== "STAFF") ||
        user.clinicId === null
      )
        return;

      if (!isConnected) {
        await reconnectSocket();
        toast.info("Reconnecting");
        return;
      }

      const totalWaiting = queueStatus?.waitingCount || 0;
      if (totalWaiting === 0) {
        toast.info("No patients waiting in queue");
        return;
      }

      setIsCallingNext(true);
      console.log("Calling next token...");
      const socket = socketRef.current;
      if (!socket?.connected) {
        await reconnectSocket();
        return;
      }

      const queue = await QueueService.getTodayQueueForClinic(user.clinicId);
      if (!queue) {
        toast.info("No queue found");
        return;
      }
      console.log("Found queue:", queue);

      socket.emit("queue:call_next", queue.id);
      toast.success("Next token called successfully");
    } catch (err) {
      console.error("Failed to call next token:", err);
      toast.error("Failed to call next token");
    } finally {
      setIsCallingNext(false);
    }
  }, [user, reconnectSocket, isConnected, queueStatus]);

  const completeCurrentToken = useCallback(async () => {
    try {
      if (
        !user ||
        (user.role !== "ADMIN" && user.role !== "STAFF") ||
        user.clinicId === null
      )
        return;

      if (!isConnected) {
        await reconnectSocket();
        toast.info("Reconnecting");
        return;
      }

      if (!queueStatus?.currentTokenNo) {
        toast.info("No token currently being served");
        return;
      }

      setIsCompleting(true);
      console.log("Completing current token...");
      const socket = socketRef.current;
      if (!socket?.connected) {
        await reconnectSocket();
        return;
      }

      const queue = await QueueService.getTodayQueueForClinic(user.clinicId);
      if (!queue) {
        toast.info("No queue found");
        return;
      }

      // Get the actual token ID for the current serving token
      const currentToken = await TokenService.getCurrentToken(
        queue.id,
        queueStatus.currentTokenNo
      );

      if (!currentToken) {
        toast.error("Failed to get current token information");
        return;
      }

      console.log(
        "Completing token for queue:",
        queue.id,
        "Token ID:",
        currentToken.id
      );
      socket.emit("queue:complete_token", queue.id, currentToken.id);

      // Refresh queue status after a short delay to ensure backend has processed
      setTimeout(async () => {
        await refreshQueueStatus();
      }, 500);

      toast.success("Token completed successfully");
    } catch (err) {
      console.error("Failed to complete token:", err);
      toast.error("Failed to complete token");
    } finally {
      setIsCompleting(false);
    }
  }, [user, reconnectSocket, queueStatus, isConnected, refreshQueueStatus]);

  // Computed values for UI state
  // currentTokenNo is the last served token number (not 0 when inactive)
  // If currentTokenNo > lastServedTokenNumber, then currentTokenNo is actively being served
  // If currentTokenNo === lastServedTokenNumber, then the token is completed
  const currentServingNumber =
    queueStatus?.currentTokenNo !== undefined && queueStatus.currentTokenNo > 0
      ? queueStatus.currentTokenNo
      : "--";
  const totalPatientsInQueue = queueStatus?.waitingCount || 0;
  const hasNoPatients = totalPatientsInQueue === 0;

  // There's an active token being served if:
  // - currentTokenNo > lastServedTokenNumber (token is being served, not yet completed)
  // OR
  // - currentTokenNo > 0 AND lastServedTokenNumber is undefined (legacy/initial state)
  // If currentTokenNo === lastServedTokenNumber, the token is completed (no active token)
  const isTokenCompleted =
    queueStatus?.currentTokenNo !== undefined &&
    queueStatus?.lastServedTokenNumber !== undefined &&
    queueStatus.currentTokenNo === queueStatus.lastServedTokenNumber;

  const hasActiveToken =
    queueStatus?.currentTokenNo !== undefined &&
    queueStatus.currentTokenNo > 0 &&
    (queueStatus.lastServedTokenNumber === undefined ||
      queueStatus.currentTokenNo > queueStatus.lastServedTokenNumber);

  // Show complete button when: no patients waiting AND there's a token being served (not yet completed)
  const showCompleteButton = hasNoPatients && hasActiveToken;
  // Show no buttons when: no patients waiting AND no active token (all done or not started)
  const showNoButtons = hasNoPatients && !hasActiveToken;

  // Debug: Log if function is undefined (should never happen)
  if (typeof generateTokenForClinic !== "function") {
    console.error(
      "ERROR: generateTokenForClinic is not a function!",
      typeof generateTokenForClinic,
      generateTokenForClinic
    );
  }

  const value: QueueContextType = {
    isConnected,
    activeToken,
    queueStatus,
    queue,
    isLoading,
    error,
    // Staff queue management states
    isCallingNext,
    isCompleting,
    // Computed UI states
    currentServingNumber,
    totalPatientsInQueue,
    hasNoPatients,
    hasActiveToken,
    isTokenCompleted,
    showCompleteButton,
    showNoButtons,
    // Functions
    joinQueue,
    leaveQueue,
    generateTokenForClinic,
    refreshActiveToken,
    reconnectSocket,
    callNextTocken,
    completeCurrentToken,
    refreshQueueStatus,
    refreshQueue,
    joinStaffQueueRoom,
  };

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }

  return context;
};

export default QueueContext;
