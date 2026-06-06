import { Request, Response } from "express";
import {
  GetQueueParamsSchema,
  GetQueueStatusParamsSchema,
  InitializeQueueBodySchema,
  InitializeQueueParamsSchema,
  ToggleQueueStatusBodySchema,
  ToggleQueueStatusParamsSchema,
} from "../schemas/queue.schema.js";
import { QueueService } from "../services/queue.service.js";
import { ResponseHandler } from "../utils/response.handler.js";

export class QueueController {
  static async initializeQueue(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as InitializeQueueParamsSchema;
      const { maxQueueSize } = req.body as InitializeQueueBodySchema;
      const queue = await QueueService.initializeQueue(clinicId, maxQueueSize);
      return ResponseHandler.success(
        res,
        "Queue initialized successfully",
        201,
        queue
      );
    } catch (error: any) {
      if (error.code === "P2002") {
        return ResponseHandler.error(res, error.message, 400, null);
      }

      if (error instanceof Error) {
        return ResponseHandler.error(res, error.message, 400, null);
      }

      console.error(error);
      return ResponseHandler.error(
        res,
        "Something went wrong. Please try again later.",
        500,
        null
      );
    }
  }

  static async getQueueStatus(req: Request, res: Response) {
    try {
      const { queueId } = req.params as GetQueueStatusParamsSchema;
      const queueStatus = await QueueService.getQueueStatus(queueId);
      return ResponseHandler.success(
        res,
        "Queue status fetched successfully",
        200,
        queueStatus
      );
    } catch (error: any) {
      if (error instanceof Error) {
        return ResponseHandler.error(res, error.message, 400, null);
      }
      console.error(error);
      return ResponseHandler.error(
        res,
        "Something went wrong. Please try again later.",
        500,
        null
      );
    }
  }

  static async getQueueByClinicId(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as GetQueueParamsSchema;
      const queue = await QueueService.getQueueByClinicId(clinicId);
      return ResponseHandler.success(
        res,
        "Queue fetched successfully",
        200,
        queue
      );
    } catch (error: any) {
      if (error instanceof Error) {
        return ResponseHandler.error(res, error.message, 400, null);
      }
    }
  }

  static async toggleQueueStatus(req: Request, res: Response) {
    try {
      const { queueId } = req.params as ToggleQueueStatusParamsSchema;
      const { isActive } = req.body as ToggleQueueStatusBodySchema;
      const queue = await QueueService.toggleQueueStatus(queueId, isActive);
      return ResponseHandler.success(
        res,
        `Queue ${isActive ? "activated" : "deactivated"} successfully`,
        200,
        queue
      );
    } catch (error: any) {
      if (error instanceof Error) {
        return ResponseHandler.error(res, error.message, 400, null);
      }
      console.error(error);
      return ResponseHandler.error(
        res,
        "Something went wrong. Please try again later.",
        500,
        null
      );
    }
  }
}
