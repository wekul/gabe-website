import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  clearDeviceSessionCookie,
  createDeviceSession,
  deleteDeviceSession,
  getCurrentDeviceSessionToken,
  setDeviceSessionCookie,
  validateDeviceSession,
} from "@/lib/device-session";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existingToken = await getCurrentDeviceSessionToken();
  if (existingToken) {
    await deleteDeviceSession(existingToken);
    await clearDeviceSessionCookie();
  }

  const deviceSession = await createDeviceSession(session.user.id);
  await setDeviceSessionCookie(deviceSession.token, deviceSession.expiresAt);

  return NextResponse.json({
    ok: true,
    expiresAt: deviceSession.expiresAt.toISOString(),
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    await clearDeviceSessionCookie();
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const token = await getCurrentDeviceSessionToken();
  const validation = await validateDeviceSession(token ?? "", session.user.id);

  if (!validation.valid) {
    await clearDeviceSessionCookie();
    return NextResponse.json({ valid: false, expired: validation.expired }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    expiresAt: validation.expiresAt.toISOString(),
  });
}

export async function DELETE() {
  const token = await getCurrentDeviceSessionToken();
  if (token) {
    await deleteDeviceSession(token);
  }

  await clearDeviceSessionCookie();
  return NextResponse.json({ ok: true });
}

