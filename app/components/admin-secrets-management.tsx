"use client";

import { Button, Input, Switch } from "@heroui/react";
import { useState, type FormEvent } from "react";
import type { EmailServerSecretRecord } from "@/lib/site-data";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialSecret: EmailServerSecretRecord;
};

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
};

export default function AdminSecretsManagement({ initialSecret }: Props) {
  const [secret, setSecret] = useState(initialSecret);
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    try {
      const response = await adminFetch("/api/admin/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...secret,
          password,
        }),
      });

      const data = (await response.json()) as { error?: string; secret?: EmailServerSecretRecord };

      if (!response.ok || !data.secret) {
        setStatusMessage(data.error ?? "Failed to save email server settings.");
        return;
      }

      setSecret(data.secret);
      setPassword("");
      setStatusMessage("Secrets saved.");
    } catch {
      setStatusMessage("Failed to save email server settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 text-white md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
            Secure Delivery
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">Secrets Manager</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Configure the SMTP host, credentials, and default sender address used for notification emails. Passwords are stored encrypted at rest.
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
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="SMTP Host"
              value={secret.host}
              isRequired
              classNames={fieldClassNames}
              onValueChange={(value) => setSecret((current) => ({ ...current, host: value }))}
            />
            <Input
              label="Port"
              type="number"
              value={String(secret.port)}
              classNames={fieldClassNames}
              onValueChange={(value) =>
                setSecret((current) => ({ ...current, port: Number(value || 587) }))
              }
            />
            <Input
              label="Username"
              value={secret.username}
              classNames={fieldClassNames}
              onValueChange={(value) => setSecret((current) => ({ ...current, username: value }))}
            />
            <Input
              label={secret.hasPassword ? "Password (leave blank to keep current)" : "Password"}
              type="password"
              value={password}
              classNames={fieldClassNames}
              onValueChange={setPassword}
            />
            <Input
              label="Default From Email"
              type="email"
              value={secret.defaultFromEmail}
              classNames={fieldClassNames}
              onValueChange={(value) =>
                setSecret((current) => ({ ...current, defaultFromEmail: value }))
              }
            />
            <div className="theme-card flex items-center justify-between rounded-2xl px-4 py-3">
              <div>
                <p className="font-medium text-white">Use TLS / SSL</p>
                <p className="text-sm text-[color:var(--theme-text-muted)]">
                  Enable this when your SMTP server expects a secure connection.
                </p>
              </div>
              <Switch
                isSelected={secret.secure}
                color="primary"
                onValueChange={(secure) => setSecret((current) => ({ ...current, secure }))}
              >
                {secret.secure ? "Secure" : "StartTLS / Plain"}
              </Switch>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" color="primary" isLoading={isSaving} className="px-6">
            Save Secrets
          </Button>
        </div>
      </form>
    </section>
  );
}
