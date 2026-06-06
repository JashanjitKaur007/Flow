import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const ClinicType = {
  GENERAL_PRACTICE: "GENERAL_PRACTICE",
  PEDIATRICS: "PEDIATRICS",
  DERMATOLOGY: "DERMATOLOGY",
  PSYCHIATRY: "PSYCHIATRY",
  GYNECOLOGY: "GYNECOLOGY",
  ORTHOPEDICS: "ORTHOPEDICS",
  ENT: "ENT",
  DENTIST: "DENTIST",
} as const;

export type ClinicTypeValue = (typeof ClinicType)[keyof typeof ClinicType];

export const TokenStatus = {
  WAITING: "WAITING",
  CALLED: "CALLED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
} as const;

export type TokenStatusValue = (typeof TokenStatus)[keyof typeof TokenStatus];

export const UserRole = {
  PATIENT: "PATIENT",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 3 characters"),
    lastName: z.string().min(3, "Last name must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updatePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, "Old password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

// Clinic Query Schema
export const getClinicsQuerySchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional(),
  query: z.string().optional(),
  type: z.nativeEnum(ClinicType).optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

export const toggleQueueStatusParamsSchema = z.object({
  queueId: z.string().uuid().min(1),
});

export const toggleQueueStatusBodySchema = z.object({
  isActive: z.boolean(),
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
    .preprocess(
      (val: string) => JSON.parse(val),
      z.object({ start: z.string(), end: z.string() })
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

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type GetClinicsQuery = z.infer<typeof getClinicsQuerySchema>;
export type ToggleQueueStatusInput = z.infer<
  typeof toggleQueueStatusBodySchema
>;
export type UpdateDoctorClinicInput = z.infer<typeof updateDoctorClinicSchema>;
export type CreateDoctorClinicInput = z.infer<typeof createDoctorClinicSchema>;

// ============================================
// INTERFACES
// ============================================

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleValue;
  clinicId: string | null;
  profilePicture?: string;
}

// Auth Response
export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// Clinic / DoctorClinic
export interface Clinic {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo?: string;
  images?: string[];
  type: ClinicTypeValue;
  openingHours: { start: string; end: string };
  distance_km?: number;
}

// Alias for backward compatibility
export type DoctorClinic = Clinic;

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Clinics Response
export interface ClinicsResponse {
  success: boolean;
  data: {
    clinics: Clinic[];
    pagination: Pagination;
  };
}

// Queue
export interface Queue {
  id: string;
  clinicId: string;
  queueDate: string;
  currentTokenNo: number;
  maxQueueSize: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Queue Status
export interface QueueStatus {
  queueId: string;
  currentTokenNo: number;
  waitingCount: number;
  startTime?: string;
  endTime?: string;
  estimatedWaitTime?: number;
  lastServedTokenNumber?: number;
}

// Token
export interface Token {
  id: string;
  queueId: string;
  patientId: string;
  tokenNumber: number;
  status: TokenStatusValue;
  createdAt?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Error Response
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Device Info for auth
export interface DeviceInfo {
  userAgent: string;
  platform?: string;
}

// ============================================
// DEPRECATED - Keep for backward compatibility
// ============================================
export const getDoctorClinicsSchema = getClinicsQuerySchema;
export type GetDoctorClinicsSchema = GetClinicsQuery;
