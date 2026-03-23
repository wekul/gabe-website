import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import { requireValidApiSession } from "@/lib/device-session";
import { sendTestNotificationEmail } from "@/lib/notifications";
import { userHasPermission } from "@/lib/site-data";

export async function POST() {
  const session = await requireValidApiSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "manage_notifications"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendTestNotificationEmail();
    await logAdminAuditEvent(session.user.id, {
      action: "send_test_notification",
      section: "notifications",
      targetType: "notification_config",
      targetId: "default",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/notifications/test" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email." },
      { status: 400 },
    );
  }
}
