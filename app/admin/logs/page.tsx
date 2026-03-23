import { getAdminStats, getUserPermissions } from "@/lib/site-data";
import { listAdminAuditLogs } from "@/lib/audit-logging";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import AdminLogBrowser from "@/app/components/admin-log-browser";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminLogsPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  const canSeeLogs =
    permissions.includes("view_sessions") ||
    permissions.includes("view_contact_messages") ||
    permissions.includes("view_admin_messages") ||
    permissions.includes("view_image_views");

  if (!canSeeLogs) {
    redirect("/unauthorised?from=logs");
  }

  const [stats, auditLogs] = await Promise.all([getAdminStats(), listAdminAuditLogs()]);
  const canSeeContactMessages = permissions.includes("view_contact_messages");
  const canSeeAdminMessages = permissions.includes("view_admin_messages");

  const visibleMessages = stats.contactMessages.filter((message: (typeof stats.contactMessages)[number]) => {
    if (message.adminMessage) {
      return canSeeAdminMessages;
    }

    return canSeeContactMessages;
  });

  return (
    <AdminShell
      eyebrow="Activity"
      title="Logs"
      description="Searchable operational records for visitor sessions, message traffic, tracked image views, and admin audit activity."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminLogBrowser
        sessions={permissions.includes("view_sessions") ? stats.recentSessions : []}
        messages={visibleMessages}
        imageViews={permissions.includes("view_image_views") ? stats.imageViews : []}
        auditLogs={auditLogs}
        permissions={permissions}
      />
    </AdminShell>
  );
}

