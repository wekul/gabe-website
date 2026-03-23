import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import { deleteContactMessage, userHasPermission } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";

async function requireMessageDeleteAccess() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "clear_anayltics"))) {
    return null;
  }

  return session;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ messageId: string }> },
) {
  const session = await requireMessageDeleteAccess();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId } = await context.params;
    await deleteContactMessage(messageId);
    await logAdminAuditEvent(session.user.id, {
      action: "delete_message",
      section: "logs",
      targetType: "message",
      targetId: messageId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/messages/[messageId]" });
    const message = error instanceof Error ? error.message : "Failed to delete message.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
