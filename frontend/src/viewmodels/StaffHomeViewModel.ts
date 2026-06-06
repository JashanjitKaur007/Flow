import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner-native";
import { useAuth } from "../context/AuthContext";
import { useQueue } from "../context/QueueContext";
import { Clinic, Queue, QueueStatus } from "../models/types";
import { ClinicService } from "../services/clinicService";
import QueueService from "../services/queueService";

export const useStaffHomeViewModel = () => {
  const { user } = useAuth();
  const { refreshQueue, queueStatus } = useQueue();
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [queueStatusData, setQueueStatusData] = useState<QueueStatus | null>(
    null
  );
  const [clinic, setClinic] = useState<Clinic | null>(null);

  const loadClinic = useCallback(async () => {
    if (!user?.clinicId) return;

    try {
      const clinicData = await ClinicService.getClinicById(user.clinicId);
      if (clinicData) {
        setClinic(clinicData);
      }
    } catch (error) {
      console.error("Failed to load clinic:", error);
      // Don't show toast for clinic load failure, just log it
    }
  }, [user?.clinicId]);

  const loadQueue = useCallback(async () => {
    if (!user?.clinicId) return;

    try {
      setIsLoading(true);
      const todayQueue = await QueueService.getTodayQueueForClinic(
        user.clinicId
      );
      setQueue(todayQueue);

      // Load queue status if queue exists
      if (todayQueue) {
        const status = await QueueService.getQueueStatus(todayQueue.id);
        setQueueStatusData(status);
      }
    } catch (error) {
      console.error("Failed to load queue:", error);
      toast.error("Failed to load queue information");
    } finally {
      setIsLoading(false);
    }
  }, [user?.clinicId]);

  // Refresh queue status when queueStatus from context changes
  useEffect(() => {
    if (queueStatus) {
      setQueueStatusData(queueStatus);
    }
  }, [queueStatus]);

  const initializeQueue = useCallback(async () => {
    if (!user?.clinicId) return;

    try {
      setIsLoading(true);
      const newQueue = await QueueService.initializeQueue(user.clinicId);
      if (newQueue) {
        setQueue(newQueue);
        await refreshQueue();
        toast.success("Queue initialized successfully");
      }
    } catch (error: any) {
      console.error("Failed to initialize queue:", error);
      const message =
        error?.response?.data?.message || "Failed to initialize queue";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.clinicId, refreshQueue]);

  const toggleQueueStatus = useCallback(
    async (isActive: boolean) => {
      if (!queue) {
        // If no queue exists, initialize it first
        if (isActive) {
          await initializeQueue();
        }
        return;
      }

      try {
        setIsLoading(true);
        const updatedQueue = await QueueService.toggleQueueStatus(
          queue.id,
          isActive
        );
        if (updatedQueue) {
          setQueue(updatedQueue);
          // Refresh queue in context to trigger socket join/leave
          await refreshQueue();
          toast.success(
            isActive
              ? "Queue started successfully"
              : "Queue paused successfully"
          );
        }
      } catch (error: any) {
        console.error("Failed to toggle queue status:", error);
        const message =
          error?.response?.data?.message || "Failed to toggle queue status";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [queue, refreshQueue, initializeQueue]
  );

  // Load clinic when user changes
  useEffect(() => {
    loadClinic();
  }, [loadClinic]);

  return {
    clinic,
    queue,
    queueStatus: queueStatusData,
    isLoading,
    loadQueue,
    loadClinic,
    initializeQueue,
    toggleQueueStatus,
  };
};
