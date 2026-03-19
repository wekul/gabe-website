import { getAdminStats, getCurrentUserRoleContext, getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import AdminRoleManagement from "@/app/components/admin-role-management";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminRolesPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("manage_roles")) {
    redirect("/unauthorised?from=roles");
  }

  const [stats, currentRoleContext] = await Promise.all([
    getAdminStats(),
    getCurrentUserRoleContext(session.user.id),
  ]);

  return (
    <AdminShell
      eyebrow="Governance"
      title="Roles"
      description="Shape the permission matrix, rank hierarchy, and role lifecycle with guardrails for destructive actions."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminRoleManagement
        initialRoles={stats.roles}
        currentUserRoleRank={currentRoleContext.rank}
        currentUserRoleName={currentRoleContext.role}
      />
    </AdminShell>
  );
}
