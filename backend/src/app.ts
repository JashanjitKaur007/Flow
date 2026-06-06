import express, { Express, Response } from "express";
import { authRouter } from "./routes/auth.route.js";
import fileUpload from "express-fileupload";
import cors from "cors";
import { clinicRouter } from "./routes/clinic.route.js";
import { queueRouter } from "./routes/queue.route.js";
import { tokenRouter } from "./routes/token.route.js";

export function initializeExpressServer(): Express {
  const app: Express = express();
  app.set("trust proxy", true);
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp",
    })
  );
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/clinic", clinicRouter);
  app.use("/api/queues", queueRouter);
  app.use("/api/tokens", tokenRouter);

  app.get("/health", (_, res: Response) => {
    res.status(200).json({
      health: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      message: "Server is running",
    });
  });

  return app;
}
