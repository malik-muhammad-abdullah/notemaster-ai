import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Use app-specific password
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log("🚀 Attempting to send email:", {
    to,
    subject,
    timestamp: new Date().toISOString(),
  });

  try {
    const info = await transporter.sendMail({
      from: {
        name: "NoteMaster AI",
        address: process.env.EMAIL_USER!,
      },
      to,
      subject,
      html,
    });

    console.log("✉️ Email sent successfully:", {
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", {
      error,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
