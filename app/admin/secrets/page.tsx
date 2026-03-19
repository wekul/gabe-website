import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSecretsManagement from "@/app/components/admin-secrets-management";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";
import { getEmailServerSecret, getUserPermissions } from "@/lib/site-data";

export default async function AdminSecretsPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!permissions.includes("manage_secrets")) {
    redirect("/unauthorised?from=secrets");
  }

  const secret = await getEmailServerSecret();

  return (
    <AdminShell
      eyebrow="Security"
      title="Secrets Manager"
      description="Configure the outbound email server and default sender settings used by notifications."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminSecretsManagement initialSecret={secret} />
    </AdminShell>
  );
}
