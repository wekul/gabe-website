"use client";

import { Button, Input, addToast } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import type { AdminAuditLogRecord } from "@/lib/audit-logging";
import type { Permission } from "@/lib/rbac";
import type {
  ContactMessage,
  ContactMessageReason,
  ImageViewRecord,
  SessionRecord,
} from "@/lib/site-data";
import { adminFetch, adminNavigate } from "@/app/components/admin-session-client";

type Props = {
  sessions: SessionRecord[];
  messages: ContactMessage[];
  imageViews: ImageViewRecord[];
  auditLogs: AdminAuditLogRecord[];
  permissions: Permission[];
};

type LogsResponse = {
  sessions: SessionRecord[];
  messages: ContactMessage[];
  imageViews: ImageViewRecord[];
  auditLogs: AdminAuditLogRecord[];
  fetchedAt: string;
};

type LogTab = "sessions" | "messages" | "images" | "audit";

function formatSeconds(value?: number) {
  if (!value || value < 1) {
    return "0m 0s";
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(isoString: string) {
  return new Date(isoString).toISOString().replace("T", " ").replace("Z", " UTC");
}

function formatAuditAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAuditSection(section: string) {
  return section
    .replace(/:/g, " / ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatContactReasonLabel(reason: ContactMessageReason) {
  switch (reason) {
    case "general_query":
      return "General Query";
    case "purchasing_query":
      return "Purchasing Query";
    case "admin_access_request":
      return "Admin Access Request";
  }
}

function getContactReasonClassName(reason: ContactMessageReason) {
  switch (reason) {
    case "general_query":
      return "rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100";
    case "purchasing_query":
      return "rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100";
    case "admin_access_request":
      return "rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100";
  }
}

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
  input: "![color:var(--theme-text)]",
  innerWrapper: "![color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
};

export default function AdminLogBrowser({
  sessions,
  messages,
  imageViews,
  auditLogs,
  permissions,
}: Props) {
  const [sessionItems, setSessionItems] = useState(sessions);
  const [messageItems, setMessageItems] = useState(messages);
  const [imageViewItems, setImageViewItems] = useState(imageViews);
  const [auditItems, setAuditItems] = useState(auditLogs);
  const [isClearing, setIsClearing] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const canSeeMessages =
    permissions.includes("view_contact_messages") ||
    permissions.includes("view_admin_messages");

  const availableTabs = [
    permissions.includes("view_sessions") ? "sessions" : null,
    canSeeMessages ? "messages" : null,
    permissions.includes("view_image_views") ? "images" : null,
    "audit",
  ].filter((value): value is LogTab => value !== null);

  const canClearLogs = permissions.includes("clear_anayltics");

  const [activeTab, setActiveTab] = useState<LogTab>(availableTabs[0] ?? "audit");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSessionItems(sessions);
  }, [sessions]);

  useEffect(() => {
    setMessageItems(messages);
  }, [messages]);

  useEffect(() => {
    setImageViewItems(imageViews);
  }, [imageViews]);

  useEffect(() => {
    setAuditItems(auditLogs);
  }, [auditLogs]);

  const refreshLogs = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsRefreshing(true);
    }

    try {
      const response = await adminFetch("/api/admin/logs", { cache: "no-store" });
      const data = (await response.json()) as LogsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to refresh logs.");
      }

      setSessionItems(data.sessions);
      setMessageItems(data.messages);
      setImageViewItems(data.imageViews);
      setAuditItems(data.auditLogs);
      setLastUpdatedAt(data.fetchedAt);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to refresh logs.");
    } finally {
      if (!options?.silent) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!isLiveMode) {
      return;
    }

    void refreshLogs({ silent: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshLogs({ silent: true });
      }
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLiveMode]);

  const pageSize = 10;

  const filteredSessions = useMemo(() => {
    if (!query.trim()) {
      return sessionItems;
    }

    const normalized = query.toLowerCase();
    return sessionItems.filter(
      (session) =>
        session.path.toLowerCase().includes(normalized) ||
        session.visitorId.toLowerCase().includes(normalized) ||
        session.authenticatedUserIdentifier?.toLowerCase().includes(normalized),
    );
  }, [query, sessionItems]);

  const filteredMessages = useMemo(() => {
    if (!query.trim()) {
      return messageItems;
    }

    const normalized = query.toLowerCase();
    return messageItems.filter(
      (message) =>
        message.name.toLowerCase().includes(normalized) ||
        message.email.toLowerCase().includes(normalized) ||
        message.message.toLowerCase().includes(normalized) ||
        message.authenticatedUserIdentifier?.toLowerCase().includes(normalized),
    );
  }, [messageItems, query]);

  const filteredImageViews = useMemo(() => {
    if (!query.trim()) {
      return imageViewItems;
    }

    const normalized = query.toLowerCase();
    return imageViewItems.filter(
      (entry) =>
        entry.imageId.toLowerCase().includes(normalized) ||
        entry.path.toLowerCase().includes(normalized) ||
        entry.visitorId.toLowerCase().includes(normalized) ||
        entry.authenticatedUserIdentifier?.toLowerCase().includes(normalized),
    );
  }, [imageViewItems, query]);

  const filteredAuditLogs = useMemo(() => {
    if (!query.trim()) {
      return auditItems;
    }

    const normalized = query.toLowerCase();
    return auditItems.filter(
      (entry) =>
        entry.userIdentifier.toLowerCase().includes(normalized) ||
        entry.userRole?.toLowerCase().includes(normalized) ||
        entry.action.toLowerCase().includes(normalized) ||
        entry.section.toLowerCase().includes(normalized) ||
        entry.targetType?.toLowerCase().includes(normalized) ||
        entry.targetId?.toLowerCase().includes(normalized) ||
        entry.details?.toLowerCase().includes(normalized),
    );
  }, [auditItems, query]);

  const activeList =
    activeTab === "sessions"
      ? filteredSessions
      : activeTab === "messages"
        ? filteredMessages
        : activeTab === "images"
          ? filteredImageViews
          : filteredAuditLogs;
  const pageCount = Math.max(1, Math.ceil(activeList.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pagedItems = activeList.slice(pageStart, pageStart + pageSize);

  const exportTarget =
    activeTab === "sessions"
      ? "sessions"
      : activeTab === "messages"
        ? "messages"
        : activeTab === "images"
          ? "image_views"
          : null;

  const exportLabel =
    activeTab === "sessions"
      ? "Export Logs"
      : activeTab === "messages"
        ? "Export Messages"
        : activeTab === "images"
          ? "Export Image Views"
          : null;

  const handleExport = () => {
    if (!exportTarget) {
      return;
    }

    void adminNavigate(`/api/admin/logs/export?target=${exportTarget}`);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (pendingDeleteMessageId !== messageId) {
      setPendingDeleteMessageId(messageId);
      addToast({
        title: "Confirm delete",
        description: "Click delete on this message again to remove it.",
        color: "warning",
      });
      window.setTimeout(() => {
        setPendingDeleteMessageId((current) => (current === messageId ? null : current));
      }, 8000);
      return;
    }

    setPendingDeleteMessageId(null);

    try {
      const response = await adminFetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete message.");
      }

      setMessageItems((current) => current.filter((message) => message.id !== messageId));
      addToast({
        title: "Message deleted",
        description: "The selected message has been removed.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete message.",
        color: "danger",
      });
    }
  };

  const handleClearLogs = async () => {
    if (!exportTarget) {
      return;
    }

    setIsClearing(true);
    setStatusMessage("");

    try {
      const response = await adminFetch("/api/admin/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: exportTarget }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to clear logs.");
      }

      if (exportTarget === "sessions") {
        setSessionItems([]);
      } else if (exportTarget === "messages") {
        setMessageItems([]);
      } else {
        setImageViewItems([]);
      }

      setPage(1);
      setStatusMessage(
        activeTab === "sessions"
          ? "Session logs cleared."
          : activeTab === "messages"
            ? "Message logs cleared."
            : "Image view logs cleared.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to clear logs.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {permissions.includes("view_sessions") ? (
            <Button size="sm" color={activeTab === "sessions" ? "primary" : "default"} variant={activeTab === "sessions" ? "solid" : "flat"} className={activeTab === "sessions" ? "px-4" : "border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]"} onPress={() => { setActiveTab("sessions"); setPage(1); }}>
              Session Logs
            </Button>
          ) : null}
          {canSeeMessages ? (
            <Button size="sm" color={activeTab === "messages" ? "primary" : "default"} variant={activeTab === "messages" ? "solid" : "flat"} className={activeTab === "messages" ? "px-4" : "border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]"} onPress={() => { setActiveTab("messages"); setPage(1); }}>
              Messages
            </Button>
          ) : null}
          {permissions.includes("view_image_views") ? (
            <Button size="sm" color={activeTab === "images" ? "primary" : "default"} variant={activeTab === "images" ? "solid" : "flat"} className={activeTab === "images" ? "px-4" : "border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]"} onPress={() => { setActiveTab("images"); setPage(1); }}>
              Image Views
            </Button>
          ) : null}
          <Button size="sm" color={activeTab === "audit" ? "primary" : "default"} variant={activeTab === "audit" ? "solid" : "flat"} className={activeTab === "audit" ? "px-4" : "border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]"} onPress={() => { setActiveTab("audit"); setPage(1); }}>
            Audit Logs
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-[color:var(--theme-text-muted)]">
          <Button size="sm" variant={isLiveMode ? "solid" : "flat"} color={isLiveMode ? "primary" : "default"} className={isLiveMode ? "px-4" : "border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]"} onPress={() => { setIsLiveMode((current) => !current); }}>
            {isLiveMode ? "Live View On" : "Live View Off"}
          </Button>
          <Button size="sm" variant="flat" className="border border-[color:var(--theme-border)] bg-white/[0.04] px-4 text-[color:var(--theme-text-soft)]" isLoading={isRefreshing} onPress={() => { void refreshLogs(); }}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[16rem] flex-1">
          <Input value={query} onValueChange={(value) => { setQuery(value); setPage(1); }} label={activeTab === "sessions" ? "Search by path or visitor" : activeTab === "messages" ? "Search messages" : activeTab === "images" ? "Search by image id, path, or visitor" : "Search by user, action, section, target, or details"} classNames={fieldClassNames} />
        </div>
        <div className="flex min-w-[13rem] flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {exportTarget && exportLabel ? (
              <Button variant="flat" className="border border-[color:var(--theme-border)] bg-white/[0.04] text-[color:var(--theme-text-soft)]" onPress={handleExport}>
                {exportLabel}
              </Button>
            ) : null}
            {canClearLogs && exportTarget ? (
              <Button color="danger" variant="flat" className="border border-red-500/30 bg-red-500/10 text-red-100" isLoading={isClearing} onPress={() => { void handleClearLogs(); }}>
                Clear Current Tab
              </Button>
            ) : null}
          </div>
          <p className="text-right text-xs text-[color:var(--theme-text-muted)]">
            {statusMessage || (lastUpdatedAt ? `Last updated ${formatTimestamp(lastUpdatedAt)}` : "Waiting for first refresh.")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {pagedItems.length === 0 ? (
          <div className="theme-card rounded-[1.25rem] border-dashed p-8 text-center text-[color:var(--theme-text-muted)]">
            No records found.
          </div>
        ) : activeTab === "sessions" ? (
          (pagedItems as SessionRecord[]).map((session) => (
            <article key={session.id} className="theme-card rounded-[1.25rem] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-accent)]">Session</p>
              <p className="text-sm text-[color:var(--theme-text-muted)]">{formatTimestamp(session.startedAt)}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--theme-text)]">{session.path} - {session.visitorId.slice(0, 8)}</p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--theme-text-muted)] md:grid-cols-2">
                <p>Time on page: {session.durationSeconds != null ? formatSeconds(session.durationSeconds) : "In progress"}</p>
                <p>Longest still point: {formatSeconds(session.maxStillSeconds)} {session.topStillPoint ? `(${session.topStillPoint})` : ""}</p>
                {session.authenticatedUserIdentifier ? <p className="md:col-span-2">Signed-in user: {session.authenticatedUserIdentifier}</p> : null}
              </div>
            </article>
          ))
        ) : activeTab === "messages" ? (
          (pagedItems as ContactMessage[]).map((message) => (
            <article key={message.id} className="theme-card rounded-[1.25rem] p-4">
              <p className="text-sm text-[color:var(--theme-text-muted)]">{formatTimestamp(message.createdAt)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-[color:var(--theme-text)]">{message.name} ({message.email})</p>
                <span className={getContactReasonClassName(message.reason)}>{formatContactReasonLabel(message.reason)}</span>
              </div>
              {message.authenticatedUserIdentifier ? <p className="mt-3 text-sm text-[color:var(--theme-text-muted)]">Signed-in user: {message.authenticatedUserIdentifier}</p> : null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--theme-text-soft)]">{message.message}</p>
              {canClearLogs ? (
                <div className="mt-4 flex justify-end">
                  <Button size="sm" color="danger" variant="flat" className="border border-red-500/30 bg-red-500/10 text-red-100" onPress={() => { void handleDeleteMessage(message.id); }}>
                    {pendingDeleteMessageId === message.id ? "Confirm Delete" : "Delete"}
                  </Button>
                </div>
              ) : null}
            </article>
          ))
        ) : activeTab === "images" ? (
          (pagedItems as ImageViewRecord[]).map((entry) => (
            <article key={entry.id} className="theme-card rounded-[1.25rem] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-accent)]">Image View</p>
              <p className="text-sm text-[color:var(--theme-text-muted)]">{formatTimestamp(entry.createdAt)}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--theme-text)]">{entry.imageId} - {entry.path}</p>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--theme-text-muted)] md:grid-cols-2">
                <p>Viewer: {entry.visitorId.slice(0, 8)}</p>
                <p>View time: {formatSeconds(entry.viewedSeconds)}</p>
                {entry.authenticatedUserIdentifier ? <p className="md:col-span-2">Signed-in user: {entry.authenticatedUserIdentifier}</p> : null}
              </div>
            </article>
          ))
        ) : (
          (pagedItems as AdminAuditLogRecord[]).map((entry) => (
            <article key={entry.id} className="theme-card rounded-[1.25rem] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-accent)]">{formatAuditSection(entry.section)}</p>
                  <p className="text-lg font-semibold text-[color:var(--theme-text)]">{formatAuditAction(entry.action)}</p>
                </div>
                <p className="text-sm text-[color:var(--theme-text-muted)]">{formatTimestamp(entry.createdAt)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--theme-text-muted)] md:grid-cols-2">
                <p>User: {entry.userIdentifier}</p>
                <p>Role: {entry.userRole ?? "Unknown"}</p>
                {entry.targetType || entry.targetId ? <p className="md:col-span-2">Target: {[entry.targetType, entry.targetId].filter(Boolean).join(" / ")}</p> : null}
              </div>
              {entry.details ? <pre className="mt-4 whitespace-pre-wrap overflow-x-auto rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-4 text-xs leading-6 text-[color:var(--theme-text-soft)]">{entry.details}</pre> : null}
            </article>
          ))
        )}
      </div>

      <div className="theme-card mt-6 flex items-center justify-between rounded-[1.25rem] px-4 py-3">
        <Button size="sm" variant="flat" className="border border-[color:var(--theme-border)] bg-white/[0.04] text-[color:var(--theme-text-soft)]" isDisabled={safePage <= 1} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
          Previous
        </Button>
        <p className="text-sm text-[color:var(--theme-text-muted)]">Page {safePage} / {pageCount}</p>
        <Button size="sm" variant="flat" className="border border-[color:var(--theme-border)] bg-white/[0.04] text-[color:var(--theme-text-soft)]" isDisabled={safePage >= pageCount} onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}>
          Next
        </Button>
      </div>
    </section>
  );
}
