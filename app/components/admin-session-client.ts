"use client";

import { signOut } from "next-auth/react";

async function handleExpiredSession() {
  await signOut({ callbackUrl: "/login?expired=1" });
}

export async function ensureActiveAdminSession() {
  const response = await fetch("/api/auth/device-session", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.ok) {
    return true;
  }

  await handleExpiredSession();
  return false;
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const isSessionActive = await ensureActiveAdminSession();

  if (!isSessionActive) {
    throw new Error("Your session has expired.");
  }

  return fetch(input, {
    ...init,
    credentials: "same-origin",
  });
}

export async function adminNavigate(url: string) {
  const isSessionActive = await ensureActiveAdminSession();

  if (!isSessionActive) {
    return;
  }

  window.location.href = url;
}
