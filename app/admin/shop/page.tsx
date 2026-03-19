import { redirect } from "next/navigation";
import AdminBackLink from "@/app/components/admin-back-link";
import AdminShopManagement from "@/app/components/admin-shop-management";
import AdminSignOut from "@/app/components/admin-signout";
import AdminShell from "@/app/components/admin-shell";
import { requireValidPageSession } from "@/lib/device-session";
import { getUserPermissions, listShopItems } from "@/lib/site-data";

export default async function AdminShopPage() {
  const session = await requireValidPageSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(session.user.id);
  if (!permissions.includes("manage_shop")) {
    redirect("/unauthorised?from=shop");
  }

  const items = await listShopItems();

  return (
    <AdminShell
      eyebrow="Commerce"
      title="Shop Management"
      description="Add and manage storefront items with delivery settings and optional stock tracking."
      actions={
        <>
          <AdminBackLink />
          <AdminSignOut />
        </>
      }
    >
      <AdminShopManagement initialItems={items} />
    </AdminShell>
  );
}
