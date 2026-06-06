import { Response } from "express";
import { HttpStatusCode, ResponseMeta } from "../types/index.js";
import { Socket } from "socket.io";

export class ResponseHandler<T = any> {
  static success<T>(
    res: Response,
    message: string = "Success",
    code: HttpStatusCode = 200,
    data: T,
    meta?: ResponseMeta
  ) {
    return res.status(code).json({
      success: true,
      data,
      message,
      meta: meta || null,
    });
  }

  static error<T>(
    res: Response,
    message: string = "Something went wrong",
    code: HttpStatusCode = 500,
    errors?: T,
    meta?: ResponseMeta
  ) {
    return res.status(code).json({
      success: false,
      message,
      errors: errors || null,
      meta: meta || null,
    });
  }

  static socketSuccess<T>(
    socket: Socket,
    event: string,
    data: T,
    message: string = "Success",
    meta?: ResponseMeta
  ) {
    socket.emit(event, {
      success: true,
      data,
      message,
      meta: meta || null,
    });
  }

  static socketError<T>(
    socket: Socket,
    event: string,
    message: string = "Something went wrong",
    errors?: T,
    meta?: ResponseMeta
  ) {
    socket.emit(event, {
      success: false,
      message,
      errors: errors || null,
      meta: meta || null,
    });
  }
}
