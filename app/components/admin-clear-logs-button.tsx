"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  target?: "all" | "analytics";
  label?: string;
};

export default function AdminClearLogsButton({
  target = "all",
  label = "Clear All Logs",
}: Props) {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState("");

  const handleClear = async () => {
    setIsClearing(true);
    setError("");

    try {
      const response = await adminFetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to clear logs.");
      }

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to clear logs.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="flat"
        color="danger"
        className="border border-red-500/30 bg-red-500/10 text-red-100"
        isLoading={isClearing}
        onPress={() => {
          void handleClear();
        }}
      >
        {label}
      </Button>
      {error ? <p className="text-right text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
