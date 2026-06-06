import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../utils/response.handler.js";
import { ValidationSchemas } from "../types/index.js";

const sources = ["params", "query", "body"] as const;

export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction) => {
    for (const source of sources) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        return ResponseHandler.error(
          res,
          `Invalid request ${source}`,
          400,
          result.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          }))
        );
      }

      if (source === "query") {
        const target = req[source] as Record<string, unknown>;
        Object.keys(target).forEach((key) => delete target[key]);
        Object.assign(target, result.data);
      } else {
        req[source] = result.data;
      }
    }
    next();
  };
