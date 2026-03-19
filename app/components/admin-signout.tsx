"use client";

import { Button } from "@heroui/react";
import { signOut } from "next-auth/react";

export default function AdminSignOut() {
  return (
    <Button
      variant="flat"
      color="danger"
      onPress={async () => {
        await fetch("/api/auth/device-session", { method: "DELETE" });
        await signOut({ callbackUrl: "/login" });
      }}
    >
      Sign Out
    </Button>
  );
}
