import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminNotificationManagement from "@/app/components/admin-notification-management";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";
import {
  getDailyNotificationConfig,
  getUserPermissions,
  listNotificationUsers,
} from "@/lib/site-data";

export default async function AdminNotificationsPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("manage_notifications")) {
    redirect("/unauthorised?from=notifications");
  }

  const [config, users] = await Promise.all([
    getDailyNotificationConfig(),
    listNotificationUsers(),
  ]);

  return (
    <AdminShell
      eyebrow="Communications"
      title="Notifications"
      description="Configure the daily notification schedule and decide which users should receive the email summary."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminNotificationManagement initialConfig={config} availableUsers={users} />
    </AdminShell>
  );
}
