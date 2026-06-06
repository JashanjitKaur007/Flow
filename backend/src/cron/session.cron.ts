import cron from "node-cron";
import { prisma } from "../prisma/client.js";
import { getTodayInEST } from "../utils/index.js";

export const initializeSessionCleanupForAllUsers = async () => {
  try {
    console.log("🔄 Starting daily queue initialization for all clinics...");
    const today = getTodayInEST();

    const sessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: today,
        },
      },
    });

    if (sessions.count === 0) {
      console.log("ℹ️  No expired sessions found. Skipping session cleanup.");
      return;
    }

    console.log(
      `📋 Found ${sessions.count} expired session(s). Cleaning up...`
    );

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    console.log("📊 Session cleanup summary:", {
      total: sessions.count,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
    });
  } catch (error) {
    console.error("💥 Fatal error in session cleanup cron job:", error);
  }
};

export const initializeSessionCleanupCronJob = () => {
  // Schedule: 5:00 AM UTC = 12:00 AM EST (midnight EST)
  // If you want it to run at midnight EDT instead, use "0 4 * * *"
  const cronExpression = "0 5 * * *";

  const now = new Date();
  const utcTime = now.toUTCString();
  const estTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  console.log("⏰ Scheduling daily session cleanup cron job...");
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
    console.log("⏰ Initializing session cleanup for all users...");
    console.log("⏰ ========================================");

    try {
      await initializeSessionCleanupForAllUsers();
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
