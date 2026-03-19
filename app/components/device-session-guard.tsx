"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const CHECK_INTERVAL_MS = 60_000;

export default function DeviceSessionGuard() {
  const { status } = useSession();
  const pathname = usePathname();
  const shouldValidate = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!shouldValidate || status !== "authenticated") {
      return;
    }

    let active = true;

    const validateSession = async () => {
      try {
        const response = await fetch("/api/auth/device-session", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok && active) {
          void signOut({ callbackUrl: "/login?expired=1" });
        }
      } catch {
        // Leave the current session untouched on transient network errors.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void validateSession();
      }
    };

    void validateSession();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void validateSession();
      }
    }, CHECK_INTERVAL_MS);

    window.addEventListener("focus", validateSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", validateSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shouldValidate, status]);

  return null;
}
