import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export const DEVICE_SESSION_COOKIE_NAME = "device_session_token";
const DEFAULT_SESSION_TIMEOUT_MINUTES = 480;

function getSessionTimeoutMinutes() {
  const value = Number.parseInt(process.env.SESSION_TIMEOUT_MINUTES ?? "", 10);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }

  return value;
}

function shouldUseSecureCookies() {
  const configuredUrl = process.env.NEXTAUTH_URL ?? "";
  return configuredUrl.startsWith("https://");
}

function getExpiryDate() {
  return new Date(Date.now() + getSessionTimeoutMinutes() * 60_000);
}

export async function createDeviceSession(userId: string) {
  await ensureDatabase();

  const token = randomBytes(32).toString("hex");
  const expiresAt = getExpiryDate();

  await prisma.deviceSession.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteDeviceSession(token: string) {
  if (!token) {
    return;
  }

  await ensureDatabase();

  await prisma.deviceSession.deleteMany({
    where: { token },
  });
}

export async function setDeviceSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function clearDeviceSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentDeviceSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(DEVICE_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function validateDeviceSession(token: string, userId?: string) {
  if (!token) {
    return { valid: false as const, expired: false };
  }

  await ensureDatabase();

  const deviceSession = await prisma.deviceSession.findUnique({
    where: { token },
    select: {
      token: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!deviceSession) {
    return { valid: false as const, expired: false };
  }

  if (deviceSession.expiresAt.getTime() <= Date.now()) {
    await deleteDeviceSession(token);
    return { valid: false as const, expired: true };
  }

  if (userId && deviceSession.userId !== userId) {
    return { valid: false as const, expired: false };
  }

  return {
    valid: true as const,
    userId: deviceSession.userId,
    expiresAt: deviceSession.expiresAt,
  };
}

export async function requireValidPageSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const token = await getCurrentDeviceSessionToken();
  const validation = await validateDeviceSession(token ?? "", session.user.id);

  if (!validation.valid) {
    redirect(validation.expired ? "/login?expired=1" : "/login");
  }

  return session;
}

export async function requireValidApiSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    await clearDeviceSessionCookie();
    return null;
  }

  const token = await getCurrentDeviceSessionToken();
  const validation = await validateDeviceSession(token ?? "", session.user.id);

  if (!validation.valid) {
    await clearDeviceSessionCookie();
    return null;
  }

  return session;
}
