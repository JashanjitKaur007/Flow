import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../utils/response.handler.js";
import { verifyAccessToken } from "../utils/token.util.js";
import { Role } from "@prisma/client";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return ResponseHandler.error(res, error.message, 401, null);
    }
    return ResponseHandler.error(res, "Unauthorized", 401, null);
  }
};

export const isPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== Role.PATIENT) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    next();
  } catch (error) {
    console.error(error);
    return ResponseHandler.error(res, "Unauthorized", 401, null);
  }
};

export const isStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== Role.STAFF) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    next();
  } catch (error) {
    console.error(error);
    return ResponseHandler.error(res, "Unauthorized", 401, null);
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== Role.ADMIN) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    next();
  } catch (error) {
    console.error(error);
    return ResponseHandler.error(res, "Unauthorized", 401, null);
  }
};

export const isAdminOrStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.STAFF) {
      return ResponseHandler.error(res, "Unauthorized", 401, null);
    }
    next();
  } catch (error) {
    console.error(error);
    return ResponseHandler.error(res, "Unauthorized", 401, null);
  }
};
