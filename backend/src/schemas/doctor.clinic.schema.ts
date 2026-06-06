import z from "zod";

export const createDoctorClinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.preprocess((val) => Number(val), z.number()),
  longitude: z.preprocess((val) => Number(val), z.number()),
  phone: z
    .string()
    .regex(/^\d{10}$/)
    .max(10)
    .optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  description: z.string().optional(),
  logo: z.any().optional(),
  images: z.array(z.any()).optional(),
  openingHours: z
    .preprocess(
      (val: string) => JSON.parse(val),
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
  type: z
    .enum([
      "GENERAL_PRACTICE",
      "PEDIATRICS",
      "DERMATOLOGY",
      "PSYCHIATRY",
      "GYNECOLOGY",
      "ORTHOPEDICS",
      "ENT",
      "DENTIST",
    ])
    .optional(),
});

export const getDoctorClinicsSchema = z
  .object({
    latitude: z.preprocess((val) => Number(val), z.number()).optional(),
    longitude: z.preprocess((val) => Number(val), z.number()).optional(),
    radius: z.preprocess((val) => Number(val), z.number()).optional(),
    page: z.preprocess((val) => Number(val), z.number()).default(1),
    limit: z.preprocess((val) => Number(val), z.number()).default(10),
    query: z.string().optional(),
    type: z
      .enum([
        "GENERAL_PRACTICE",
        "PEDIATRICS",
        "DERMATOLOGY",
        "PSYCHIATRY",
        "GYNECOLOGY",
        "ORTHOPEDICS",
        "ENT",
        "DENTIST",
      ])
      .optional(),
  })
  .optional();

export const getDoctorClinicSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const createDoctorClinicStaffParamsSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const createDoctorClinicStaffBodySchema = z.object({
  email: z.email().min(1),
});

export const getDoctorClinicStaffParamsSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const updateDoctorClinicParamsSchema = z.object({
  clinicId: z.uuid().min(1),
});

export const updateDoctorClinicSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  latitude: z.preprocess((val) => Number(val), z.number()).optional(),
  longitude: z.preprocess((val) => Number(val), z.number()).optional(),
  phone: z
    .string()
    .regex(/^\d{10}$/)
    .max(10)
    .optional(),
  email: z.email().optional(),
  website: z.url().optional(),
  description: z.string().optional(),
  openingHours: z
    .union([
      z.object({
        start: z.string(),
        end: z.string(),
      }),
      z.string(),
    ])
    .optional()
    .transform((val) => (typeof val === "string" ? JSON.parse(val) : val)),
  type: z
    .enum([
      "GENERAL_PRACTICE",
      "PEDIATRICS",
      "DERMATOLOGY",
      "PSYCHIATRY",
      "GYNECOLOGY",
      "ORTHOPEDICS",
      "ENT",
      "DENTIST",
    ])
    .optional(),
});

export type CreateDoctorClinicSchema = z.infer<typeof createDoctorClinicSchema>;
export type GetDoctorClinicsSchema = z.infer<typeof getDoctorClinicsSchema>;
export type GetDoctorClinicSchema = z.infer<typeof getDoctorClinicSchema>;
export type CreateDoctorClinicStaffParamsSchema = z.infer<
  typeof createDoctorClinicStaffParamsSchema
>;
export type CreateDoctorClinicStaffBodySchema = z.infer<
  typeof createDoctorClinicStaffBodySchema
>;
export type GetDoctorClinicStaffParamsSchema = z.infer<
  typeof getDoctorClinicStaffParamsSchema
>;

export type UpdateDoctorClinicParamsSchema = z.infer<
  typeof updateDoctorClinicParamsSchema
>;
export type UpdateDoctorClinicSchema = z.infer<typeof updateDoctorClinicSchema>;
