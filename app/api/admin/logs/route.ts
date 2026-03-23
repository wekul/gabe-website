import { NextResponse } from "next/server";
import { logServerError } from "@/lib/error-logging";
import { listAdminAuditLogs, logAdminAuditEvent } from "@/lib/audit-logging";
import { requireValidApiSession } from "@/lib/device-session";
import {
  clearAnalyticsLogs,
  type ClearAnalyticsLogsTarget,
  getAdminStats,
  userHasPermission,
} from "@/lib/site-data";

async function getLogAccess() {
  const session = await requireValidApiSession();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const permissionsToCheck = [
    "view_sessions",
    "view_contact_messages",
    "view_admin_messages",
    "view_image_views",
    "clear_anayltics",
  ] as const;

  const permissionEntries = await Promise.all(
    permissionsToCheck.map(async (permission) => [
      permission,
      await userHasPermission(userId, permission),
    ]),
  );

  const permissions = Object.fromEntries(permissionEntries) as Record<
    (typeof permissionsToCheck)[number],
    boolean
  >;

  const canSeeLogs =
    permissions.view_sessions ||
    permissions.view_contact_messages ||
    permissions.view_admin_messages ||
    permissions.view_image_views;

  if (!canSeeLogs && !permissions.clear_anayltics) {
    return null;
  }

  return {
    session,
    permissions,
  };
}

async function getDeleteTarget(request: Request): Promise<ClearAnalyticsLogsTarget> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return "analytics";
  }

  try {
    const body = (await request.json()) as { target?: string };
    const target = body.target ?? "analytics";

    if (
      target === "analytics" ||
      target === "sessions" ||
      target === "image_views" ||
      target === "messages" ||
      target === "all"
    ) {
      return target;
    }
  } catch {
    return "analytics";
  }

  throw new Error("Invalid clear target.");
}

export async function GET() {
  const access = await getLogAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, auditLogs] = await Promise.all([getAdminStats(), listAdminAuditLogs()]);

  const messages = stats.contactMessages.filter((message: (typeof stats.contactMessages)[number]) => {
    if (message.adminMessage) {
      return access.permissions.view_admin_messages;
    }

    return access.permissions.view_contact_messages;
  });

  return NextResponse.json({
    sessions: access.permissions.view_sessions ? stats.recentSessions : [],
    messages,
    imageViews: access.permissions.view_image_views ? stats.imageViews : [],
    auditLogs,
    fetchedAt: new Date().toISOString(),
  });
}

export async function DELETE(request: Request) {
  const access = await getLogAccess();
  if (!access?.session.user?.id || !access.permissions.clear_anayltics) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const target = await getDeleteTarget(request);
    const result = await clearAnalyticsLogs(target);

    await logAdminAuditEvent(access.session.user.id, {
      action: "clear_logs",
      section: "logs",
      targetType: "log_target",
      targetId: target,
      details: result,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/logs" });
    const message = error instanceof Error ? error.message : "Failed to clear logs.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

