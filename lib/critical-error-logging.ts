import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDailyNotificationConfig, getEmailServerSecretForTransport, userHasPermission } from "@/lib/site-data";

type CriticalErrorContext = Record<string, unknown>;

type CriticalErrorInput = {
  source: string;
  path?: string;
  message: string;
  stack?: string | null;
  digest?: string | null;
  context?: CriticalErrorContext;
  userId?: string | null;
  userIdentifier?: string | null;
};

async function getCriticalErrorRecipients() {
  const roles = await prisma.rolePermission.findMany({
    where: { permission: "view_error_logs" },
    select: { roleName: true },
    distinct: ["roleName"],
  });

  const roleNames = roles.map((entry) => entry.roleName);
  if (roleNames.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: roleNames },
      email: { not: null },
    },
    select: {
      email: true,
    },
    orderBy: { email: "asc" },
  });

  return Array.from(new Set(users.map((user) => user.email?.trim()).filter(Boolean)));
}

async function sendCriticalErrorEmail(log: {
  source: string;
  path: string | null;
  message: string;
  stack: string | null;
  digest: string | null;
  userIdentifier: string | null;
  createdAt: Date;
}) {
  const [notificationConfig, serverSecret, recipients] = await Promise.all([
    getDailyNotificationConfig(),
    getEmailServerSecretForTransport(),
    getCriticalErrorRecipients(),
  ]);

  if (!serverSecret || !serverSecret.host) {
    throw new Error("Email server settings are not configured.");
  }

  const fromEmail = notificationConfig.fromEmail || serverSecret.defaultFromEmail;
  if (!fromEmail) {
    throw new Error("A sender email must be configured before sending critical error notifications.");
  }

  if (recipients.length === 0) {
    throw new Error("No admin email recipients are available for critical error notifications.");
  }

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

  const lines = [
    "A critical application error has been reported.",
    "",
    `Source: ${log.source}`,
    `Path: ${log.path ?? "Unknown"}`,
    `Time: ${log.createdAt.toISOString()}`,
    `User: ${log.userIdentifier ?? "Anonymous"}`,
    `Digest: ${log.digest ?? "N/A"}`,
    "",
    "Message:",
    log.message,
  ];

  if (log.stack) {
    lines.push("", "Stack:", log.stack);
  }

  await transport.sendMail({
    from: fromEmail,
    to: recipients.join(", "),
    subject: `Critical site error: ${log.path ?? log.source}`,
    text: lines.join("\n"),
  });
}

export async function canCurrentUserViewCriticalErrors() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return false;
    }

    return userHasPermission(userId, "view_error_logs");
  } catch {
    return false;
  }
}

export async function logCriticalError(input: CriticalErrorInput) {
  const context = input.context ? JSON.parse(JSON.stringify(input.context)) : undefined;

  const createdLog = await prisma.criticalErrorLog.create({
    data: {
      source: input.source,
      path: input.path || null,
      message: input.message,
      stack: input.stack || null,
      digest: input.digest || null,
      userId: input.userId || null,
      userIdentifier: input.userIdentifier || null,
      context,
    },
  });

  try {
    await sendCriticalErrorEmail(createdLog);
    await prisma.criticalErrorLog.update({
      where: { id: createdLog.id },
      data: { emailNotifiedAt: new Date(), emailError: null },
    });
  } catch (error) {
    await prisma.criticalErrorLog.update({
      where: { id: createdLog.id },
      data: {
        emailError: error instanceof Error ? error.message : "Critical error email failed.",
      },
    });
  }

  return createdLog;
}
