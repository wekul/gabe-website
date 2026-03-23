import { NextResponse } from "next/server";
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/notifications/test" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email." },
      { status: 400 },
    );
  }
}


