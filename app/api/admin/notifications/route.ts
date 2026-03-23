import { NextResponse } from "next/server";
import { logServerError } from "@/lib/error-logging";
import { requireValidApiSession } from "@/lib/device-session";
import {
  getDailyNotificationConfig,
  listNotificationUsers,
  updateDailyNotificationConfig,
  userHasPermission,
} from "@/lib/site-data";

async function requireManageNotifications() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_notifications"))) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireManageNotifications();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config, users] = await Promise.all([
    getDailyNotificationConfig(),
    listNotificationUsers(),
  ]);

  return NextResponse.json({ config, users });
}

export async function POST(request: Request) {
  const session = await requireManageNotifications();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      enabled?: boolean;
      sendHour?: number;
      sendMinute?: number;
      timezone?: string;
      fromEmail?: string;
      recipientUserIds?: string[];
    };

    const config = await updateDailyNotificationConfig({
      enabled: Boolean(body.enabled),
      sendHour: typeof body.sendHour === "number" ? body.sendHour : 9,
      sendMinute: typeof body.sendMinute === "number" ? body.sendMinute : 0,
      timezone: body.timezone ?? "Europe/London",
      fromEmail: body.fromEmail ?? "",
      recipientUserIds: Array.isArray(body.recipientUserIds) ? body.recipientUserIds : [],
    });

    return NextResponse.json({ config });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/notifications" });
    const message = error instanceof Error ? error.message : "Failed to save notifications.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


