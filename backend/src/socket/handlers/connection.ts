import { Server, Socket } from "socket.io";
import { initializeQueueHandler } from "./queue.handler.js";

export const handleConnection = (socket: Socket) => {
  console.log(`🟢 Connected: ${socket.id}`);
  initializeQueueHandler(socket);
  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
};
