import type { Prisma } from "@prisma/client";
import { ensureDatabase } from "@/lib/db";
import { prisma } from "@/lib/prisma";

type AuditDetails = Record<string, unknown> | undefined;

export type AdminAuditEventInput = {
  action: string;
  section: string;
  targetType?: string;
  targetId?: string;
  details?: AuditDetails;
};

export type AdminAuditLogRecord = {
  id: string;
  userIdentifier: string;
  userRole?: string;
  action: string;
  section: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  createdAt: string;
};

function mapAdminAuditLog(log: {
  id: string;
  userIdentifier: string;
  userRole: string | null;
  action: string;
  section: string;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: Date;
}): AdminAuditLogRecord {
  return {
    id: log.id,
    userIdentifier: log.userIdentifier,
    userRole: log.userRole ?? undefined,
    action: log.action,
    section: log.section,
    targetType: log.targetType ?? undefined,
    targetId: log.targetId ?? undefined,
    details: log.details == null ? undefined : JSON.stringify(log.details, null, 2),
    createdAt: log.createdAt.toISOString(),
  };
}

export async function listAdminAuditLogs() {
  await ensureDatabase();

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return logs.map(mapAdminAuditLog);
}

export async function logAdminAuditEvent(userId: string, input: AdminAuditEventInput) {
  try {
    await ensureDatabase();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: user?.id ?? userId,
        userIdentifier: user?.username ?? user?.email ?? userId,
        userRole: user?.role ?? null,
        action: input.action,
        section: input.section,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write admin audit log", {
      error,
      userId,
      input,
    });
  }
}
