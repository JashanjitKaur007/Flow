import { Router } from "express";
import {
  isAdminOrStaff,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/schema.validate.middleware.js";
import {
  getQueueParamsSchema,
  getQueueStatusParamsSchema,
  initializeQueueBodySchema,
  initializeQueueParamsSchema,
  toggleQueueStatusBodySchema,
  toggleQueueStatusParamsSchema,
} from "../schemas/queue.schema.js";
import { QueueController } from "../controllers/queue.controller.js";

const router = Router();

router.post(
  "/init/:clinicId",
  isAuthenticated,
  isAdminOrStaff,
  validate({
    params: initializeQueueParamsSchema,
    body: initializeQueueBodySchema,
  }),
  QueueController.initializeQueue
);

router.get(
  "/:clinicId",
  isAuthenticated,
  validate({
    params: getQueueParamsSchema,
  }),
  QueueController.getQueueByClinicId
);

router.get(
  "/:queueId/status",
  isAuthenticated,
  validate({
    params: getQueueStatusParamsSchema,
  }),
  QueueController.getQueueStatus
);

router.patch(
  "/:queueId/status",
  isAuthenticated,
  isAdminOrStaff,
  validate({
    params: toggleQueueStatusParamsSchema,
    body: toggleQueueStatusBodySchema,
  }),
  QueueController.toggleQueueStatus
);

export { router as queueRouter };
