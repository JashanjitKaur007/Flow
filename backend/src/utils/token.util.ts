import { env } from "../config/dotenv.config.js";
import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "../types/index.js";
import crypto from "crypto";

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_PRIVATE_KEY! as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN! as jwt.SignOptions["expiresIn"],
    algorithm: "RS256",
    issuer: "flow",
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY! as jwt.Secret, {
    algorithms: ["RS256"],
  }) as AccessTokenPayload;
  if (!decoded.id) {
    throw new Error("Invalid token");
  }
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    throw new Error("Token expired");
  }

  return decoded;
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
