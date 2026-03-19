import nodemailer from "nodemailer";
import {
  getDailyNotificationConfig,
  getEmailServerSecretForTransport,
  type NotificationRecipientRecord,
} from "@/lib/site-data";

function buildRecipientList(recipients: NotificationRecipientRecord[]) {
  const emails = recipients.map((recipient) => recipient.email.trim()).filter(Boolean);

  if (emails.length === 0) {
    throw new Error("At least one notification recipient with an email address is required.");
  }

  return emails;
}

export async function sendTestNotificationEmail() {
  const [notificationConfig, serverSecret] = await Promise.all([
    getDailyNotificationConfig(),
    getEmailServerSecretForTransport(),
  ]);

  if (!serverSecret || !serverSecret.host) {
    throw new Error("Email server settings are not configured.");
  }

  const fromEmail = notificationConfig.fromEmail || serverSecret.defaultFromEmail;
  if (!fromEmail) {
    throw new Error("A sender email must be configured before sending notifications.");
  }

  const recipientEmails = buildRecipientList(notificationConfig.recipients);

  const transport = nodemailer.createTransport({
    host: serverSecret.host,
    port: serverSecret.port,
    secure: serverSecret.secure,
    auth:
      serverSecret.username || serverSecret.password
        ? {
            user: serverSecret.username,
            pass: serverSecret.password,
          }
        : undefined,
  });

  await transport.sendMail({
    from: fromEmail,
    to: recipientEmails.join(", "),
    subject: "Daily Notification Test",
    text:
      "This is a test notification email from the admin notification system. The SMTP server and sender configuration are working.",
  });
}
