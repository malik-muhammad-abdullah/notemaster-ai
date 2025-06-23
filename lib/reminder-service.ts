import cron from "node-cron";
import { prisma } from "@/prisma/client";
import { sendEmail } from "./email";

let isRunning = false;

async function checkReminders() {
  // Prevent multiple concurrent executions
  if (isRunning) {
    console.log("🔄 Previous reminder check still running, skipping...");
    return;
  }

  console.log("⏰ Starting reminder check:", {
    timestamp: new Date().toISOString(),
  });

  isRunning = true;

  try {
    // Get all unsent reminders that should be sent by now
    const reminders = await prisma.taskReminder.findMany({
      where: {
        sent: false,
        sendAt: {
          lte: new Date(),
        },
      },
      include: {
        task: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("📋 Found reminders to process:", {
      count: reminders.length,
      timestamp: new Date().toISOString(),
    });

    const results = await Promise.all(
      reminders.map(async (reminder) => {
        if (!reminder.task.user.email) {
          console.error("❌ No email found for user:", {
            userId: reminder.task.user.id,
            taskId: reminder.task.id,
            timestamp: new Date().toISOString(),
          });
          return null;
        }

        try {
          // Send email using nodemailer
          await sendEmail({
            to: reminder.task.user.email,
            subject: `Task Reminder: ${reminder.task.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Task Reminder</h2>
                <p>This is a reminder for your task:</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1F2937;">${reminder.task.title}</h3>
                  ${reminder.task.description ? `<p style="margin: 0 0 10px 0; color: #4B5563;">${reminder.task.description}</p>` : ""}
                  <p style="margin: 0; color: #4B5563;">
                    <strong>Due:</strong> ${new Date(reminder.task.dueDate).toLocaleString()}
                  </p>
                  <p style="margin: 10px 0 0 0; color: #4B5563;">
                    <strong>Priority:</strong> ${reminder.task.priority}
                  </p>
                </div>
                <p style="color: #6B7280;">
                  You're receiving this email because you set up a reminder for this task.
                </p>
              </div>
            `,
          });

          // Mark reminder as sent
          await prisma.taskReminder.update({
            where: { id: reminder.id },
            data: { sent: true },
          });

          console.log("✅ Reminder processed successfully:", {
            reminderId: reminder.id,
            taskId: reminder.task.id,
            userId: reminder.task.user.id,
            timestamp: new Date().toISOString(),
          });

          return {
            success: true,
            reminderId: reminder.id,
            taskId: reminder.task.id,
          };
        } catch (error) {
          console.error("❌ Failed to process reminder:", {
            reminderId: reminder.id,
            taskId: reminder.task.id,
            userId: reminder.task.user.id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          return {
            success: false,
            reminderId: reminder.id,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    console.log("✨ Reminder check completed:", {
      processedCount: results.filter(Boolean).length,
      successCount: results.filter((r) => r && r.success).length,
      failureCount: results.filter((r) => r && !r.success).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Reminder check failed:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  } finally {
    isRunning = false;
  }
}

// Schedule the cron job to run every minute
export function startReminderService() {
  console.log("🚀 Starting reminder service");

  // Run every minute
  cron.schedule("* * * * *", () => {
    checkReminders().catch((error) => {
      console.error("❌ Unhandled error in reminder check:", error);
    });
  });

  // Also run immediately on startup
  checkReminders().catch((error) => {
    console.error("❌ Unhandled error in initial reminder check:", error);
  });
}
