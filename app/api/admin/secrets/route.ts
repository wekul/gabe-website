import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import { requireValidApiSession } from "@/lib/device-session";
import { getEmailServerSecret, updateEmailServerSecret, userHasPermission } from "@/lib/site-data";

async function requireManageSecrets() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_secrets"))) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireManageSecrets();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = await getEmailServerSecret();
  return NextResponse.json({ secret });
}

export async function POST(request: Request) {
  const session = await requireManageSecrets();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      host?: string;
      port?: number;
      secure?: boolean;
      username?: string;
      password?: string;
      defaultFromEmail?: string;
    };

    const secret = await updateEmailServerSecret({
      host: body.host ?? "",
      port: typeof body.port === "number" ? body.port : 587,
      secure: Boolean(body.secure),
      username: body.username ?? "",
      password: body.password ?? "",
      defaultFromEmail: body.defaultFromEmail ?? "",
    });

    await logAdminAuditEvent(session.user.id, {
      action: "update_secrets",
      section: "secrets_manager",
      targetType: "email_server",
      targetId: secret.id,
      details: {
        host: secret.host,
        port: secret.port,
        secure: secret.secure,
        username: secret.username,
        hasPassword: secret.hasPassword,
      },
    });

    return NextResponse.json({ secret });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/secrets" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save secrets." },
      { status: 400 },
    );
  }
}
