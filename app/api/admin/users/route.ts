import { NextResponse } from "next/server";
import { logServerError } from "@/lib/error-logging";
import { createUser, listUsers, userHasPermission } from "@/lib/site-data";
import { requireValidApiSession } from "@/lib/device-session";

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

export async function GET() {
  const session = await requireManageUsers();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await requireManageUsers();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    const user = await createUser(session.user.id, {
      name: body.name,
      username: body.username ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
      role: body.role ?? "viewer",
    });

    return NextResponse.json({ user });
  } catch (error) {
    await logServerError(error, { source: "/api/admin/users" });
    const message = error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


