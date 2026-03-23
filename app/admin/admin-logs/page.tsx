import { listAppErrorLogs, getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import AdminErrorLogBrowser from "@/app/components/admin-error-log-browser";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminErrorLogsPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("view_error_logs")) {
    redirect("/unauthorised?from=admin-logs");
  }

  const logs = await listAppErrorLogs();

  return (
    <AdminShell
      eyebrow="Diagnostics"
      title="Admin Logs"
      description="Captured server-side errors written to the database for debugging and operational review."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminErrorLogBrowser logs={logs} />
    </AdminShell>
  );
}
