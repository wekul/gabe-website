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
      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border-t border-[color:var(--theme-accent)]/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.008))] px-0 pb-7 pt-6"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)] md:text-xs">
              {card.accent}
            </p>
            <p className="text-sm uppercase tracking-[0.16em] text-[color:var(--theme-text-muted)]">{card.label}</p>
            <p className="mt-5 text-[2.4rem] font-semibold tracking-[-0.06em] text-[color:var(--theme-text)]">{card.value}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
