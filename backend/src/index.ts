import { initializeServer } from "./server.js";
import { initializeQueueCronJob } from "./cron/queue.cron.js";
import { initializeSessionCleanupCronJob } from "./cron/session.cron.js";

initializeServer();
initializeQueueCronJob();
initializeSessionCleanupCronJob();
