import fileUpload from "express-fileupload";
import { JwtPayload } from "jsonwebtoken";
import { ZodType } from "zod";

export type ResponseMeta = Record<string, any>;

export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503; // Service Unavailable;

export interface AccessTokenPayload extends JwtPayload {
  id: string;
  email?: string;
  role?: string;
  type: "access";
}

export interface ValidationSchemas {
  body?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
}

declare global {
  namespace Express {
    interface Request {
      user: AccessTokenPayload;
    }
  }

  interface Socket {
    user: AccessTokenPayload;
  }
}

export type UploadedImage = {
  name: string;
  tempFilePath: string;
};

export type OpeningHours = {
  start: string;
  end: string;
};

export type ClinicFiles = fileUpload.FileArray & {
  logo?: fileUpload.UploadedFile | string;
  images?: fileUpload.UploadedFile[] | string[];
};

export type UpdateProfileFiles = fileUpload.FileArray & {
  profilePicture?: fileUpload.UploadedFile | string;
};

export type ImageType = Buffer | UploadedImage | string;
