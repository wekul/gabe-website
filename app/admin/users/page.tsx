import { getAdminStats, getCurrentUserRoleContext, getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import AdminUserManagement from "@/app/components/admin-user-management";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminUsersPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("manage_users")) {
    redirect("/unauthorised?from=users");
  }

  const [stats, currentRoleContext] = await Promise.all([
    getAdminStats(),
    getCurrentUserRoleContext(session.user.id),
  ]);

  return (
    <AdminShell
      eyebrow="Identity"
      title="Users"
      description="Manage accounts, assign lower-ranked roles, rotate credentials, and protect privileged identities."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminUserManagement
        initialUsers={stats.users}
        availableRoles={stats.roles}
        currentUserId={session.user.id}
        currentUserRoleRank={currentRoleContext.rank}
      />
    </AdminShell>
  );
}
