import z from "zod";

export const generateTokenForClinicSchema = z
  .object({
    queueId: z.uuid(),
  })
  .strict();

export const deleteTokenForClinicSchema = z
  .object({
    tokenId: z.uuid(),
  })
  .strict();

export const getTokenForPatientSchema = z
  .object({
    patientId: z.uuid(),
  })
  .strict();

export const getTokenForQueueSchema = z
  .object({
    queueId: z.uuid(),
  })
  .strict();

export const getTokenForQueueQuerySchema = z
  .object({
    tokenNumber: z.coerce.number(),
    status: z.enum(["WAITING", "CALLED", "SKIPPED", "COMPLETED"]),
  })
  .strict();

export type GenerateTokenForClinicSchema = z.infer<
  typeof generateTokenForClinicSchema
>;
export type DeleteTokenForClinicSchema = z.infer<
  typeof deleteTokenForClinicSchema
>;
export type GetTokenForPatientSchema = z.infer<typeof getTokenForPatientSchema>;
export type GetTokenForQueueSchema = z.infer<typeof getTokenForQueueSchema>;
export type GetTokenForQueueQuerySchema = z.infer<
  typeof getTokenForQueueQuerySchema
>;
