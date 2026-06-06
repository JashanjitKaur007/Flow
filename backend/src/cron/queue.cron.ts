import cron from "node-cron";
import { prisma } from "../prisma/client.js";
import { QueueService } from "../services/queue.service.js";
import { getTodayInEST } from "../utils/index.js";

export const initializeQueuesForAllClinics = async () => {
  try {
    console.log("🔄 Starting daily queue initialization for all clinics...");

    const clinics = await prisma.doctorClinic.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (clinics.length === 0) {
      console.log(
        "ℹ️  No active clinics found. Skipping queue initialization."
      );
      return;
    }

    console.log(
      `📋 Found ${clinics.length} active clinic(s). Initializing queues...`
    );

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{
        clinicId: string;
        clinicName: string;
        error: string;
      }>,
    };

    for (const clinic of clinics) {
      try {
        const queueDate = getTodayInEST();
        const existingQueue = await prisma.queue.findFirst({
          where: {
            clinicId: clinic.id,
            queueDate,
          },
        });

        if (existingQueue) {
          console.log(
            `⏭️  Queue already exists for clinic: ${clinic.name} (${clinic.id})`
          );
          results.skipped++;
          continue;
        }

        await QueueService.initializeQueue(clinic.id, undefined);
        console.log(
          `✅ Queue initialized for clinic: ${clinic.name} (${clinic.id})`
        );
        results.success++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `❌ Failed to initialize queue for clinic: ${clinic.name} (${clinic.id}) - ${errorMessage}`
        );
        results.failed++;
        results.errors.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          error: errorMessage,
        });
      }
    }

    console.log("📊 Queue initialization summary:", {
      total: clinics.length,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
    });

    if (results.errors.length > 0) {
      console.error("⚠️  Errors encountered:", results.errors);
    }
  } catch (error) {
    console.error("💥 Fatal error in queue initialization cron job:", error);
  }
};

export const initializeQueueCronJob = () => {
  // Schedule: 5:00 AM UTC = 12:00 AM EST (midnight EST)
  // If you want it to run at midnight EDT instead, use "0 4 * * *"
  const cronExpression = "0 5 * * *";

  const now = new Date();
  const utcTime = now.toUTCString();
  const estTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  console.log("⏰ Scheduling daily queue initialization cron job...");
  console.log(
    `📅 Cron schedule: ${cronExpression} (5:00 AM UTC = 12:00 AM EST)`
  );
  console.log(`   Current server time: ${utcTime}`);
  console.log(`   Current EST time: ${estTime.toLocaleString()}`);
  console.log(`   Next run: Will execute daily at 12:00 AM EST (midnight)`);

  const scheduledTask = cron.schedule(cronExpression, async () => {
    const triggerTime = new Date();
    console.log("⏰ ========================================");
    console.log("⏰ Cron job triggered at:", triggerTime.toISOString());
    console.log("⏰ UTC time:", triggerTime.toUTCString());
    console.log(
      "⏰ EST time:",
      triggerTime.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    console.log("⏰ Initializing queues for all clinics...");
    console.log("⏰ ========================================");

    try {
      await initializeQueuesForAllClinics();
      console.log(
        "✅ Cron job completed successfully at:",
        new Date().toISOString()
      );
    } catch (error) {
      console.error("❌ Cron job failed at:", new Date().toISOString(), error);
    }
  });

  if (scheduledTask) {
    console.log("✅ Queue initialization cron job scheduled successfully");
    console.log(`   Task status: ${scheduledTask.getStatus()}`);
  } else {
    console.error("❌ Failed to schedule cron job");
  }
};
