import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import { listImageSpotlights, setImageSpotlight, userHasPermission } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";

async function requireManageTheme() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_theme"))) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireManageTheme();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spotlights = await listImageSpotlights();
  return NextResponse.json({ spotlights });
}

export async function POST(request: Request) {
  const session = await requireManageTheme();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      imageId?: string;
      enabled?: boolean;
    };

    const spotlight = await setImageSpotlight(body.imageId ?? "", Boolean(body.enabled));
    await logAdminAuditEvent(session.user.id, {
      action: "update_spotlight",
      section: "theme",
      targetType: "image",
      targetId: spotlight.imageId,
      details: { enabled: spotlight.enabled },
    });
    return NextResponse.json({ spotlight });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/theme/spotlights" });
    const message = error instanceof Error ? error.message : "Failed to update spotlight.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
