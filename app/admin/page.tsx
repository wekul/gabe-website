import Link from "next/link";
import { getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";

const destinationCardClassName =
  "group relative overflow-hidden border-t border-[color:var(--theme-accent)]/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))] px-0 pb-7 pt-6 transition duration-200 hover:border-[color:var(--theme-accent-strong)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))]";

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
    permissions.includes("view_error_logs") ||
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
      description="A single workspace for audience review, communication, identity governance, and storefront operations."
      actions={<AdminBackLink href="/" label="Back to Home" />}
    >
      <div className="grid gap-12 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.9fr)] xl:items-start">
        <div className="max-w-2xl xl:sticky xl:top-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[color:var(--theme-accent)] md:text-xs">
            Working Overview
          </p>
          <p className="mt-5 text-lg leading-8 text-[color:var(--theme-text-muted)]">
            Move between insight, communication, identity, and storefront controls. The dashboard only
            exposes the sections your role is allowed to work inside.
          </p>
          <div className="mt-10 border-t border-[color:var(--theme-border)] pt-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--theme-text-muted)]">
              Available sections
            </p>
            <p className="mt-3 text-5xl font-semibold tracking-[-0.08em] text-[color:var(--theme-text)]">
              {
                [
                  permissions.includes("view_analytics"),
                  canSeeLogs,
                  permissions.includes("view_error_logs"),
                  permissions.includes("manage_theme"),
                  permissions.includes("manage_notifications"),
                  permissions.includes("manage_secrets"),
                  permissions.includes("manage_shop"),
                  permissions.includes("manage_users"),
                  permissions.includes("manage_roles"),
                ].filter(Boolean).length
              }
            </p>
          </div>
        </div>

        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {permissions.includes("view_analytics") ? (
            <Link href="/admin/analytics" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Insight
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Analytics</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Visitor counts, return visitors, and time-on-site signals.
              </p>
            </Link>
          ) : null}

          {canSeeLogs ? (
            <Link href="/admin/logs" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Activity
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Logs</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Sessions, contact traffic, admin requests, and tracked image views.
              </p>
            </Link>
          ) : null}

          {permissions.includes("view_error_logs") ? (
            <Link href="/admin/admin-logs" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Diagnostics
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Admin Logs</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Captured application errors, route failures, and server-side exceptions.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_theme") ? (
            <Link href="/admin/theme" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Brand
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Theme</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Control the visual direction, palette, and gradients across the site.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_notifications") ? (
            <Link href="/admin/notifications" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Communications
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Notifications</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Schedule daily summaries and control who receives them.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_secrets") ? (
            <Link href="/admin/secrets" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Security
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Secrets Manager</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Configure SMTP, sender identity, and protected service credentials.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_shop") ? (
            <Link href="/admin/shop" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Commerce
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Shop</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Edit listings, reorder works, and manage storefront publishing.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_users") ? (
            <Link href="/admin/users" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Identity
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Users</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Create users, assign roles, rotate passwords, and retire accounts.
              </p>
            </Link>
          ) : null}

          {permissions.includes("manage_roles") ? (
            <Link href="/admin/roles" className={destinationCardClassName}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
                Governance
              </p>
              <p className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--theme-text)]">Roles</p>
              <p className="mt-4 max-w-[22rem] text-[15px] leading-8 text-[color:var(--theme-text-muted)]">
                Shape permissions, rank hierarchy, and role lifecycle.
              </p>
            </Link>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
