import { NextResponse } from "next/server";
import { requireValidApiSession } from "@/lib/device-session";
import {
  deleteUser,
  updateUserPassword,
  updateUserRole,
  userHasPermission,
} from "@/lib/site-data";

async function requireManageUsers() {
  const session = await requireValidApiSession();

  if (!session?.user?.id) {
    return null;
  }

  if (!(await userHasPermission(session.user.id, "manage_users"))) {
    return null;
  }

  return session;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await requireManageUsers();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;

    if (userId === session.user?.id) {
      return NextResponse.json(
        { error: "You cannot modify your own admin account from this screen." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      role?: string;
      password?: string;
    };

    if (typeof body.password === "string" && body.password.trim()) {
      await updateUserPassword(session.user.id, userId, body.password);
      return NextResponse.json({ ok: true });
    }

    const user = await updateUserRole(session.user.id, userId, body.role ?? "viewer");
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await requireManageUsers();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await context.params;

    if (userId === session.user?.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active admin account." },
        { status: 400 },
      );
    }

    await deleteUser(session.user.id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
