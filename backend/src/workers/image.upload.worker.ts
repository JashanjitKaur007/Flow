import { uploadImage } from "../utils/cloudinary.uploader.js";
import { prisma } from "../prisma/client.js";
import { Job, Worker, bullMQRedis } from "../redis/index.js";

const imageWorker = new Worker(
  "image-upload",
  async (job: Job) => {
    console.log(
      `Processing Job ${job.id} with data ${JSON.stringify(job.data)}`
    );
    try {
      let { image, type, clinicId } = job.data;
      if (image.data && Array.isArray(image.data)) {
        image = Buffer.from(image.data);
      }
      const imageUrl = await uploadImage(image, type);
      if (job.name === "clinic-logo-upload") {
        await prisma.doctorClinic.update({
          where: { id: clinicId },
          data: { logo: imageUrl },
        });
      }

      if (job.name === "clinic-images-upload") {
        await prisma.doctorClinic.update({
          where: { id: clinicId },
          data: {
            images: { push: imageUrl },
          },
        });
      }

      return imageUrl;
    } catch (error) {
      console.error(`Job ${job.id} failed! Error: `);
      console.error(error);
      throw error;
    }
  },
  {
    connection: bullMQRedis,
    concurrency: 10,
    lockDuration: 20_000,
  }
);

imageWorker.on("failed", async (job: Job | undefined, error) => {
  console.error(`Job ${job?.id} failed! Error: `);
  console.error(error);
});
