import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import { logAdminAuditEvent } from "@/lib/audit-logging";

export async function POST(request: Request) {
  const session = await requireValidApiSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      section?: string;
      targetType?: string;
      targetId?: string;
      details?: Record<string, unknown>;
    };

    if (!body.action || !body.section) {
      return NextResponse.json({ error: "Action and section are required." }, { status: 400 });
    }

    await logAdminAuditEvent(session.user.id, {
      action: body.action,
      section: body.section,
      targetType: body.targetType,
      targetId: body.targetId,
      details: body.details,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to log audit event." },
      { status: 400 },
    );
  }
}
