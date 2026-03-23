"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { adminFetch } from "@/app/components/admin-session-client";

function formatSection(pathname: string) {
  if (pathname === "/admin") {
    return "dashboard";
  }

  return pathname.replace(/^\/admin\/?/, "").replace(/\//g, ":") || "dashboard";
}

export default function AdminAuditTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) {
      return;
    }

    void adminFetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "visit_section",
        section: formatSection(pathname),
        targetType: "path",
        targetId: pathname,
        details: {
          pathname,
        },
      }),
    }).catch(() => {
      // Leave navigation untouched if audit logging fails.
    });
  }, [pathname]);

  return null;
}
