"use client";

import { Button, Checkbox, Input, Switch } from "@heroui/react";
import { useMemo, useState, type FormEvent } from "react";
import type {
  DailyNotificationConfigRecord,
  NotificationRecipientRecord,
} from "@/lib/site-data";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialConfig: DailyNotificationConfigRecord;
  availableUsers: NotificationRecipientRecord[];
};

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
};

function formatTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function AdminNotificationManagement({ initialConfig, availableUsers }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedUsers = useMemo(
    () => new Set(config.recipientUserIds),
    [config.recipientUserIds],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setIsSaving(true);

    try {
      const response = await adminFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = (await response.json()) as {
        error?: string;
        config?: DailyNotificationConfigRecord;
      };

      if (!response.ok || !data.config) {
        setStatusMessage(data.error ?? "Failed to save notification settings.");
        return;
      }

      setConfig(data.config);
      setStatusMessage("Notification schedule saved.");
    } catch {
      setStatusMessage("Failed to save notification settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 text-white md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
            Delivery Schedule
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">Notification Emails</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Configure a daily notification time and choose which users receive the email summary. This page stores the schedule and recipients; an email transport and scheduled job still need to call it.
          </p>
        </div>
        {statusMessage ? (
          <div className="theme-status-pill rounded-full px-4 py-2 text-sm text-[color:var(--theme-text-soft)]">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="theme-card rounded-[1.5rem] p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Schedule</p>
              <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
                Pick one time each day and whether the notification run is enabled.
              </p>
            </div>
            <Switch
              isSelected={config.enabled}
              color="primary"
              onValueChange={(enabled) => {
                setConfig((current) => ({ ...current, enabled }));
              }}
            >
              {config.enabled ? "Enabled" : "Disabled"}
            </Switch>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input
              label="Send Time"
              type="time"
              value={formatTimeValue(config.sendHour, config.sendMinute)}
              description="24-hour clock."
              classNames={fieldClassNames}
              onValueChange={(value) => {
                const [hour, minute] = value.split(":").map((part) => Number(part || 0));
                setConfig((current) => ({
                  ...current,
                  sendHour: Number.isFinite(hour) ? hour : 9,
                  sendMinute: Number.isFinite(minute) ? minute : 0,
                }));
              }}
            />
            <Input
              label="Timezone"
              value={config.timezone}
              description="IANA timezone, for example Europe/London or America/New_York."
              classNames={fieldClassNames}
              onValueChange={(value) => {
                setConfig((current) => ({ ...current, timezone: value }));
              }}
            />
            <Input
              label="From Email"
              type="email"
              value={config.fromEmail}
              description="Overrides the default sender from Secrets Manager for notification emails."
              classNames={fieldClassNames}
              onValueChange={(value) => {
                setConfig((current) => ({ ...current, fromEmail: value }));
              }}
            />
          </div>
        </div>

        <div className="theme-card rounded-[1.5rem] p-5 md:p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold text-white">Recipients</p>
            <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
              Only users with an email address can receive scheduled notifications.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {availableUsers.map((user) => (
              <label
                key={user.id}
                className="theme-card rounded-2xl px-4 py-3 transition hover:border-[color:var(--theme-accent-strong)] hover:bg-white/[0.04]"
              >
                <Checkbox
                  isSelected={selectedUsers.has(user.id)}
                  onValueChange={(checked) => {
                    setConfig((current) => ({
                      ...current,
                      recipientUserIds: checked
                        ? Array.from(new Set([...current.recipientUserIds, user.id]))
                        : current.recipientUserIds.filter((id) => id !== user.id),
                    }));
                  }}
                  classNames={{ label: "text-white" }}
                >
                  <span className="block font-medium">{user.name ?? user.username}</span>
                  <span className="block text-sm text-[color:var(--theme-text-muted)]">{user.email}</span>
                </Checkbox>
              </label>
            ))}
          </div>
        </div>

        <div className="theme-card rounded-[1.5rem] p-5 md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
            Current Summary
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--theme-text-muted)]">
            {config.enabled ? "Active" : "Inactive"} at {formatTimeValue(config.sendHour, config.sendMinute)} ({config.timezone}) to {config.recipientUserIds.length} recipient{config.recipientUserIds.length === 1 ? "" : "s"}. Sender: {config.fromEmail || "Uses Secrets Manager default"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" color="primary" isLoading={isSaving} className="px-6">
            Save Notification Settings
          </Button>
          <Button
            type="button"
            variant="flat"
            className="border border-[color:var(--theme-border)] bg-white/[0.04] text-[color:var(--theme-text-soft)]"
            isLoading={isSendingTest}
            onPress={async () => {
              setStatusMessage("");
              setIsSendingTest(true);

              try {
                const response = await adminFetch("/api/admin/notifications/test", {
                  method: "POST",
                });
                const data = (await response.json()) as { error?: string };

                if (!response.ok) {
                  setStatusMessage(data.error ?? "Failed to send test email.");
                  return;
                }

                setStatusMessage("Test email sent.");
              } catch {
                setStatusMessage("Failed to send test email.");
              } finally {
                setIsSendingTest(false);
              }
            }}
          >
            Send Test Email
          </Button>
        </div>
      </form>
    </section>
  );
}
