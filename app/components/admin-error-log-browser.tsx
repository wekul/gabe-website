"use client";

import { Input } from "@heroui/react";
import { useMemo, useState } from "react";
import type { AppErrorLogRecord } from "@/lib/site-data";

type Props = {
  logs: AppErrorLogRecord[];
};

function formatTimestamp(iso: string) {
  return iso.replace("T", " ").replace(".000Z", " UTC");
}

export default function AdminErrorLogBrowser({ logs }: Props) {
  const [query, setQuery] = useState("");

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return logs;
    }

    return logs.filter((entry) =>
      [entry.source, entry.message, entry.stack ?? "", entry.context ?? ""]
        .join("\n")
        .toLowerCase()
        .includes(normalized),
    );
  }, [logs, query]);

  return (
    <section className="space-y-6">
      <div className="theme-card rounded-[1.5rem] p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--theme-accent)]">
              Application Errors
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--theme-text-muted)]">
              Review captured server-side exceptions, failed API actions, and checkout/runtime errors written into the database.
            </p>
          </div>
          <Input
            label="Search logs"
            value={query}
            onValueChange={setQuery}
            classNames={{
              inputWrapper:
                "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
              input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
              innerWrapper: "![color:var(--theme-text)]",
              label: "!text-[color:var(--theme-text-soft)]",
            }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {filteredLogs.length === 0 ? (
          <div className="theme-card rounded-[1.5rem] px-6 py-8 text-[color:var(--theme-text-muted)]">
            No error logs found.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <article key={entry.id} className="theme-card rounded-[1.5rem] p-5 md:p-6">
              <div className="flex flex-col gap-3 border-b border-[color:var(--theme-border)] pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--theme-accent)]">
                    {entry.source}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[color:var(--theme-text)]">
                    {entry.message}
                  </h3>
                </div>
                <p className="text-sm text-[color:var(--theme-text-muted)]">{formatTimestamp(entry.createdAt)}</p>
              </div>

              {entry.context ? (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-text-soft)]">
                    Context
                  </p>
                  <pre className="overflow-x-auto rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-4 py-4 text-sm leading-7 text-[color:var(--theme-text-soft)] whitespace-pre-wrap">{entry.context}</pre>
                </div>
              ) : null}

              {entry.stack ? (
                <details className="mt-5 rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-4 py-4">
                  <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--theme-text)]">
                    Stack Trace
                  </summary>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-[color:var(--theme-text-soft)]">{entry.stack}</pre>
                </details>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
