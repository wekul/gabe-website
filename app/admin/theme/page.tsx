import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import AdminThemeManagement from "@/app/components/admin-theme-management";
import { getSiteTheme, getUserPermissions, listImageSpotlights } from "@/lib/site-data";
import { requireValidPageSession } from "@/lib/device-session";

export default async function AdminThemePage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.includes("manage_theme")) {
    redirect("/unauthorised?from=theme");
  }

  const [theme, imageSpotlights] = await Promise.all([
    getSiteTheme(),
    listImageSpotlights(),
  ]);

  return (
    <AdminShell
      eyebrow="Brand System"
      title="Theme"
      description="Manage the shared website palette, gradient, and image spotlight settings so public pages and admin sections stay visually aligned."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminThemeManagement initialTheme={theme} initialImageSpotlights={imageSpotlights} />
    </AdminShell>
  );
}
