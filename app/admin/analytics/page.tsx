import { getAdminStats, getUserPermissions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}

export default async function AdminAnalyticsPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("view_analytics")) {
    redirect("/unauthorised?from=analytics");
  }

  const stats = await getAdminStats();

  const cards = [
    {
      label: "Total Visitors",
      value: String(stats.totalVisitors),
      accent: "Audience",
    },
    {
      label: "Returning Visitors",
      value: String(stats.returningVisitors),
      accent: "Retention",
    },
    {
      label: "Total Sessions",
      value: String(stats.totalSessions),
      accent: "Traffic",
    },
    {
      label: "Avg Time on Site",
      value: formatSeconds(stats.averageDurationSeconds),
      accent: "Engagement",
    },
  ];

  return (
    <AdminShell
      eyebrow="Insight"
      title="Analytics"
      description="High-level traffic and engagement signals across the site, designed for fast operational review."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="theme-subpanel rounded-[1.5rem] p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
              {card.accent}
            </p>
            <p className="text-sm text-[color:var(--theme-text-muted)]">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
