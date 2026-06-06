import z from "zod";

export const initializeQueueParamsSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const initializeQueueBodySchema = z.object({
  maxQueueSize: z.number().optional(),
});

export const getQueueStatusParamsSchema = z.object({
  queueId: z.uuid().min(1),
});

export const getQueueParamsSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const toggleQueueStatusParamsSchema = z.object({
  queueId: z.uuid().min(1),
});

export const toggleQueueStatusBodySchema = z.object({
  isActive: z.boolean(),
});

export type InitializeQueueParamsSchema = z.infer<
  typeof initializeQueueParamsSchema
>;
export type InitializeQueueBodySchema = z.infer<
  typeof initializeQueueBodySchema
>;
export type GetQueueStatusParamsSchema = z.infer<
  typeof getQueueStatusParamsSchema
>;
export type GetQueueParamsSchema = z.infer<typeof getQueueParamsSchema>;
export type ToggleQueueStatusParamsSchema = z.infer<
  typeof toggleQueueStatusParamsSchema
>;
export type ToggleQueueStatusBodySchema = z.infer<
  typeof toggleQueueStatusBodySchema
>;
