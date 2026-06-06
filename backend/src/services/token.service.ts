import { TokenStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { redis } from "../redis/index.js";
import { getIO } from "../socket/index.js";
import { QueueService } from "./queue.service.js";
import { getTodayInEST } from "../utils/index.js";

export class TokenService {
  static generateTokenForClinic = async (
    queueId: string,
    patientId: string
  ) => {
    if (!queueId) {
      throw new Error("Queue ID is required");
    }
    if (!patientId) {
      throw new Error("Patient ID is required");
    }

    await redis.del(`queue:status:${queueId}`);

    const token = await prisma.$transaction(async (tx) => {
      const existingToken = await tx.token.findFirst({
        where: {
          queueId,
          patientId,
          status: "WAITING",
        },
      });

      if (existingToken) {
        throw new Error("You already have an active token");
      }

      const queueDate = getTodayInEST();

      const queue = await tx.queue.findUnique({
        where: {
          id: queueId,
          queueDate: { equals: queueDate },
          isActive: true,
        },
      });

      if (!queue) {
        throw new Error("Queue not found");
      }

      const lastToken = await tx.token.findFirst({
        where: { queueId },
        orderBy: { tokenNumber: "desc" },
      });

      const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

      return await tx.token.create({
        data: {
          queueId,
          patientId,
          tokenNumber,
        },
      });
    });

    const queueStatus = await QueueService.getQueueStatus(queueId);
    getIO().to(`queue:${queueId}`).emit("queue:status_update", queueStatus);
    return token;
  };

  static async getNextToken(queueId: string) {
    return await prisma.$transaction(async (tx) => {
      const token = await tx.token.findFirst({
        where: {
          queueId,
          status: "WAITING",
        },
        orderBy: { tokenNumber: "asc" },
      });

      if (!token) {
        throw new Error("No waiting tokens in this queue");
      }

      const queue = await tx.queue.findUnique({
        where: { id: queueId, isActive: true },
      });

      if (!queue) {
        throw new Error("Queue not found");
      }

      const lastCalledToken = await tx.token.findFirst({
        where: { queueId, status: "CALLED" },
        orderBy: { tokenNumber: "desc" },
      });

      if (lastCalledToken) {
        await tx.token.update({
          where: { id: lastCalledToken.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      await tx.queue.update({
        where: { id: queueId },
        data: { currentTokenNo: { increment: 1 } },
      });

      return await tx.token.update({
        where: { id: token.id },
        data: { status: "CALLED", calledAt: new Date() },
      });
    });
  }

  static async skipToken(queueId: string, tokenId: string) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.token.updateMany({
        where: {
          id: tokenId,
          queueId,
          status: { in: ["WAITING", "CALLED"] },
        },
        data: {
          status: "SKIPPED",
          skippedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error("Token not found or cannot be skipped");
      }

      return await tx.token.findUniqueOrThrow({ where: { id: tokenId } });
    });
  }

  static async completeToken(queueId: string, tokenId: string) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.token.updateMany({
        where: {
          id: tokenId,
          queueId,
          status: "CALLED",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error("Token is not called or already completed");
      }

      return await tx.token.findUniqueOrThrow({ where: { id: tokenId } });
    });
  }

  static deleteTokenForClinic = async (tokenId: string, patientId: string) => {
    return await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({
        where: { id: tokenId, patientId },
      });
      if (!token) {
        throw new Error("Token not found");
      }

      const queueId = token.queueId;
      const deletedTokenNumber = token.tokenNumber;

      await tx.token.delete({ where: { id: token.id } });

      await tx.token.updateMany({
        where: {
          queueId,
          status: "WAITING",
          tokenNumber: { gt: deletedTokenNumber },
        },
        data: { tokenNumber: { decrement: 1 } },
      });

      const affectedTokens = await tx.token.findMany({
        where: {
          queueId,
          status: "WAITING",
          tokenNumber: { gte: deletedTokenNumber },
        },
        include: {
          patient: {
            select: {
              id: true,
            },
          },
        },
      });

      const queueStatus = await QueueService.getQueueStatus(queueId);

      return { queueId, affectedTokens, queueStatus };
    });
  };

  static getTokenForPatient = async (patientId: string) => {
    return await prisma.token.findFirst({
      where: {
        patientId,
        status: "WAITING",
      },
      orderBy: { tokenNumber: "asc" },
    });
  };

  static getCurrentTokenForQueue = async (
    queueId: string,
    tokenNumber: number,
    status: TokenStatus
  ) => {
    return await prisma.token.findFirst({
      where: {
        queueId,
        tokenNumber,
        status,
      },
    });
  };
}
