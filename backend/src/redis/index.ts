import { Redis } from "ioredis";
import { env } from "../config/dotenv.config.js";
import { Queue, Worker, Job } from "bullmq";

let bullMQRedis: Redis;
let redis: Redis;

if (process.env.NODE_ENV === "development") {
  bullMQRedis = new Redis({
    db: 0,
    maxRetriesPerRequest: null,
    port: 6379,
    host: env.REDIS_HOST,
  });
  redis = new Redis({ db: 0, port: 6379, host: env.REDIS_HOST });
} else {
  bullMQRedis = new Redis(env.REDIS_URL!, {
    db: 0,
    maxRetriesPerRequest: null,
  });
  redis = new Redis(env.REDIS_URL!, { db: 0 });
}

export { bullMQRedis, redis, Queue, Worker, Job };
