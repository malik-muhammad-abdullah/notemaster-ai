import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { sendEmail } from "@/lib/email";

// This route should be called by a cron job every minute
export async function GET(request: Request) {
  console.log("⏰ Cron job started:", {
    timestamp: new Date().toISOString(),
  });

  try {
    // Verify cron secret to ensure this is called by the cron job
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log("❌ Cron job unauthorized:", {
        timestamp: new Date().toISOString(),
        receivedAuth: authHeader,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    console.log("✨ Cron job completed:", {
      processedCount: results.filter(Boolean).length,
      successCount: results.filter((r) => r && r.success).length,
      failureCount: results.filter((r) => r && !r.success).length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      results: results.filter(Boolean),
    });
  } catch (error) {
    console.error("❌ Cron job failed:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Failed to check reminders" },
      { status: 500 }
    );
  }
}
