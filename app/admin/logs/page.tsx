import { getAdminStats, getUserPermissions } from "@/lib/site-data";
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

  const stats = await getAdminStats();
  const canSeeContactMessages = permissions.includes("view_contact_messages");
  const canSeeAdminMessages = permissions.includes("view_admin_messages");

  const visibleMessages = stats.contactMessages.filter((message) => {
    if (message.adminMessage) {
      return canSeeAdminMessages;
    }

    return canSeeContactMessages;
  });

  return (
    <AdminShell
      eyebrow="Activity"
      title="Logs"
      description="Searchable operational records for visitor sessions, message traffic, and tracked image views."
      actions={
        <>
          {/* {permissions.includes("clear_anayltics") ? <AdminClearLogsButton /> : null} */}
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminLogBrowser
        sessions={permissions.includes("view_sessions") ? stats.recentSessions : []}
        messages={visibleMessages}
        imageViews={permissions.includes("view_image_views") ? stats.imageViews : []}
        permissions={permissions}
      />
    </AdminShell>
  );
}
