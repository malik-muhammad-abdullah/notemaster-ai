import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { sendEmail } from "@/lib/email";

// POST: Send reminders for tasks
export async function POST(request: Request) {
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

    const results = await Promise.all(
      reminders.map(async (reminder) => {
        if (!reminder.task.user.email) {
          console.error(`No email found for user ${reminder.task.user.id}`);
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

          return {
            success: true,
            reminderId: reminder.id,
            taskId: reminder.task.id,
          };
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.id}:`, error);
          return {
            success: false,
            reminderId: reminder.id,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    return NextResponse.json({
      results: results.filter(Boolean),
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
