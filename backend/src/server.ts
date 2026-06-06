import { createServer, Server as HttpServer } from "node:http";
import { Express } from "express";
import { env } from "./config/dotenv.config.js";
import { initializeSocket } from "./socket/index.js";
import { initializeExpressServer } from "./app.js";

export function initializeServer(): void {
  const app: Express = initializeExpressServer();
  const server: HttpServer = createServer(app);

  initializeSocket(server);

  server.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
}
