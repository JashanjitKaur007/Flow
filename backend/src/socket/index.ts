import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { handleConnection } from "./handlers/connection.js";
import { verifyAccessToken } from "../utils/token.util.js";

let ioInstance: Server;

export function initializeSocket(server: HttpServer) {
  ioInstance = new Server(server, {
    cors: {
      origin: ["*"],
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("UNAUTHORIZED"));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  });

  ioInstance.on("connection", (socket: Socket) => {
    handleConnection(socket);

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${reason}`);
    });
  });

  console.log("🔌 Socket.IO initialized");
}

export function getIO() {
  if (!ioInstance) throw new Error("Socket.io is not initialized.");
  return ioInstance;
}
