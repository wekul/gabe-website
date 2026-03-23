import { NextResponse } from "next/server";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { logServerError } from "@/lib/error-logging";
import { createOrUpdateRole, deleteRole, listRoles, userHasPermission } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";

async function getSessionWithRoleAccess() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  const [canManageRoles, canManageUsers] = await Promise.all([
    userHasPermission(session.user.id, "manage_roles"),
    userHasPermission(session.user.id, "manage_users"),
  ]);

  return {
    session,
    canManageRoles,
    canManageUsers,
  };
}

export async function GET() {
  const access = await getSessionWithRoleAccess();
  if (!access || (!access.canManageRoles && !access.canManageUsers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await listRoles();
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const access = await getSessionWithRoleAccess();
  if (!access?.canManageRoles || !access.session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      permissions?: string[];
      rank?: number;
    };

    const role = await createOrUpdateRole(access.session.user.id, {
      name: body.name ?? "",
      description: body.description,
      permissions: body.permissions ?? [],
      rank: body.rank,
    });

    await logAdminAuditEvent(access.session.user.id, {
      action: "save_role",
      section: "roles",
      targetType: "role",
      targetId: role.name,
      details: { rank: role.rank, permissions: role.permissions },
    });

    return NextResponse.json({ role });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/roles" });
    const message = error instanceof Error ? error.message : "Failed to save role.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const access = await getSessionWithRoleAccess();
  if (!access?.canManageRoles || !access.session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { name?: string };
    await deleteRole(access.session.user.id, body.name ?? "");
    await logAdminAuditEvent(access.session.user.id, {
      action: "delete_role",
      section: "roles",
      targetType: "role",
      targetId: body.name ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/roles" });
    const message = error instanceof Error ? error.message : "Failed to delete role.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
