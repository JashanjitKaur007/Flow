import { Socket } from "socket.io";
import { TokenService } from "../../services/token.service.js";
import { getIO } from "../index.js";
import { QueueService } from "../../services/queue.service.js";
import { redis } from "../../redis/index.js";

export const initializeQueueHandler = (socket: Socket) => {
  socket.on("join-queue", async (queueId: string) => {
    try {
      socket.join(`queue:${queueId}`);
      socket.join(`patient:${socket.data.user.id}`);
      console.log(`🟢 Socket ${socket.id} joined queue ${queueId}`);
      getIO().to(`queue:${queueId}`).emit("join-queue", undefined);
      const queueStatus = await QueueService.getQueueStatus(queueId);
      getIO().to(`queue:${queueId}`).emit("queue:status_update", queueStatus);
    } catch (error) {
      if (error instanceof Error) {
        getIO().to(`queue:${queueId}`).emit("join-queue-error", error.message);
      } else {
        console.error(error);
        getIO()
          .to(`queue:${queueId}`)
          .emit(
            "join-queue-error",
            "Something went wrong. Please try again later."
          );
      }
    }
  });

  socket.on("leave-queue", async (queueId: string) => {
    try {
      socket.leave(`queue:${queueId}`);
      console.log(`🔴 Socket ${socket.id} left queue ${queueId}`);
      getIO().to(`queue:${queueId}`).emit("leave-queue", undefined);
    } catch (error) {
      if (error instanceof Error) {
        getIO().to(`queue:${queueId}`).emit("leave-queue-error", error.message);
      } else {
        console.error(error);
        getIO()
          .to(`queue:${queueId}`)
          .emit(
            "leave-queue-error",
            "Something went wrong. Please try again later."
          );
      }
    }
  });

  socket.on("queue:call_next", async (queueId: string) => {
    try {
      const nextToken = await TokenService.getNextToken(queueId);
      if (!nextToken) {
        getIO()
          .to(`queue:${queueId}`)
          .emit("queue:empty", "No more tokens waiting.");
        return;
      }

      getIO()
        .to(`patient:${nextToken.patientId}`)
        .emit("queue:your_token_called", nextToken);
      await redis.del(`queue:status:${queueId}`);
      const queueStatus = await QueueService.getQueueStatus(queueId);
      getIO().to(`queue:${queueId}`).emit("queue:status_update", queueStatus);
    } catch (error) {
      if (error instanceof Error) {
        getIO()
          .to(`queue:${queueId}`)
          .emit("queue:call_next_error", error.message);
      } else {
        console.error(error);
        getIO()
          .to(`queue:${queueId}`)
          .emit(
            "queue:call_next_error",
            "Something went wrong. Please try again later."
          );
      }
    }
  });

  socket.on("queue:skip_token", async (queueId: string, tokenId: string) => {
    try {
      const token = await TokenService.skipToken(queueId, tokenId);
      getIO()
        .to(`patient:${token.patientId}`)
        .emit("queue:your_token_skipped", token);
      await redis.del(`queue:status:${queueId}`);
      const queueStatus = await QueueService.getQueueStatus(queueId);
      getIO().to(`queue:${queueId}`).emit("queue:status_update", queueStatus);
    } catch (error) {
      if (error instanceof Error) {
        getIO()
          .to(`queue:${queueId}`)
          .emit("queue:skip_token_error", error.message);
      } else {
        console.error(error);
        getIO()
          .to(`queue:${queueId}`)
          .emit(
            "queue:skip_token_error",
            "Something went wrong. Please try again later."
          );
      }
    }
  });

  socket.on(
    "queue:complete_token",
    async (queueId: string, tokenId: string) => {
      try {
        const token = await TokenService.completeToken(queueId, tokenId);
        getIO()
          .to(`patient:${token.patientId}`)
          .emit("queue:your_token_completed", token);
        await redis.del(`queue:status:${queueId}`);
        const queueStatus = await QueueService.getQueueStatus(queueId);
        getIO().to(`queue:${queueId}`).emit("queue:status_update", queueStatus);
      } catch (error) {
        if (error instanceof Error) {
          getIO()
            .to(`queue:${queueId}`)
            .emit("queue:complete_token_error", error.message);
        } else {
          console.error(error);
          getIO()
            .to(`queue:${queueId}`)
            .emit(
              "queue:complete_token_error",
              "Something went wrong. Please try again later."
            );
        }
      }
    }
  );
};
