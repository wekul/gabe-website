import Link from "next/link";
import { getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";

const destinationCardClassName =
  "theme-subpanel group flex min-h-[17rem] flex-col rounded-[1.6rem] p-6 transition duration-200 hover:-translate-y-1 hover:border-[color:var(--theme-accent-strong)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)]";

export default async function AdminPage() {
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

  const hasVisiblePage =
    permissions.includes("view_analytics") ||
    canSeeLogs ||
    permissions.includes("manage_theme") ||
    permissions.includes("manage_users") ||
    permissions.includes("manage_roles") ||
    permissions.includes("manage_notifications") ||
    permissions.includes("manage_secrets") ||
    permissions.includes("manage_shop");

  if (!hasVisiblePage) {
    redirect("/unauthorised");
  }

  return (
    <AdminShell
      eyebrow="Control Center"
      title="Admin Dashboard"
      description="Use this page as the main navigation hub for analytics, logs, theme control, user management, and role governance."
      actions={<AdminBackLink href="/" label="Back to Home" />}
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {permissions.includes("view_analytics") ? (
          <Link href="/admin/analytics" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Insight
            </p>
            <p className="text-xl font-semibold text-white">Analytics</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Visitor counts, return visitors, and session time summaries.
            </p>
          </Link>
        ) : null}

        {canSeeLogs ? (
          <Link href="/admin/logs" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Activity
            </p>
            <p className="text-xl font-semibold text-white">Logs</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Sessions, messages, admin requests, and image-view activity.
            </p>
          </Link>
        ) : null}

        {permissions.includes("manage_theme") ? (
          <Link href="/admin/theme" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Brand
            </p>
            <p className="text-xl font-semibold text-white">Theme</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Control the shared gradient, surfaces, and palette across the website.
            </p>
          </Link>
        ) : null}
        {permissions.includes("manage_notifications") ? (
          <Link href="/admin/notifications" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Communications
            </p>
            <p className="text-xl font-semibold text-white">Notifications</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Set the daily notification time and choose which users receive the email summary.
            </p>
          </Link>
        ) : null}

        {permissions.includes("manage_secrets") ? (
          <Link href="/admin/secrets" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Security
            </p>
            <p className="text-xl font-semibold text-white">Secrets Manager</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Configure the SMTP server, credentials, and the default sender address.
            </p>
          </Link>
        ) : null}

        {permissions.includes("manage_shop") ? (
          <Link href="/admin/shop" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Commerce
            </p>
            <p className="text-xl font-semibold text-white">Shop</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Manage shop configuration, product operations, and storefront administration.
            </p>
          </Link>
        ) : null}


        {permissions.includes("manage_users") ? (
          <Link href="/admin/users" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Identity
            </p>
            <p className="text-xl font-semibold text-white">Users</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Create users, assign roles, rotate passwords, and remove accounts.
            </p>
          </Link>
        ) : null}

        {permissions.includes("manage_roles") ? (
          <Link href="/admin/roles" className={destinationCardClassName}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              Governance
            </p>
            <p className="text-xl font-semibold text-white">Roles</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
              Manage the permissions matrix, rank hierarchy, and role lifecycle.
            </p>
          </Link>
        ) : null}
      </div>
    </AdminShell>
  );
}
