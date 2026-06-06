import { Queue, bullMQRedis } from "../redis/index.js";

export const imageQueue = new Queue("image-upload", {
  connection: bullMQRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
