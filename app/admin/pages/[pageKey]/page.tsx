import { notFound, redirect } from "next/navigation";
import PageEditorWorkspace from "@/app/components/page-editor-workspace";
import { requireValidPageSession } from "@/lib/device-session";
import { getSiteTheme, listShopItems, userHasPermission } from "@/lib/site-data";
import {
  ensurePageContentVersionBaseline,
  getPageBuiltinLayout,
  getPageContent,
  getPageContentFieldLabels,
  getPageContentItems,
  getPageContentSlotLabels,
  listPageContentVersions,
  type PageKey,
} from "@/lib/page-content";

const PAGE_META: Record<PageKey, { title: string; publicHref: string }> = {
  home: { title: "Homepage Editor", publicHref: "/" },
  contact: { title: "Contact Page Editor", publicHref: "/contact" },
  shop: { title: "Shop Page Editor", publicHref: "/shop" },
};

function isPageKey(value: string): value is PageKey {
  return value in PAGE_META;
}

export default async function AdminPageEditor({ params }: { params: Promise<{ pageKey: string }> }) {
  const session = await requireValidPageSession();
  const { pageKey } = await params;

  if (!isPageKey(pageKey)) {
    notFound();
  }

  const userId = session.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const [canManagePages, siteTheme] = await Promise.all([
    userHasPermission(userId, "manage_pages"),
    getSiteTheme(),
  ]);

  if (!canManagePages || !siteTheme.pageEditorBetaEnabled) {
    redirect("/unauthorised?from=pages");
  }

  await ensurePageContentVersionBaseline(pageKey);

  const [content, layout, items, versions, shopItems] = await Promise.all([
    getPageContent(pageKey),
    getPageBuiltinLayout(pageKey),
    getPageContentItems(pageKey),
    listPageContentVersions(pageKey),
    pageKey === "shop" ? listShopItems() : Promise.resolve([]),
  ]);

  const fields = Object.entries(getPageContentFieldLabels(pageKey)).map(([key, label]) => ({
    key,
    label,
    multiline: key === "body" || key === "emptyState",
  }));
  const slots = Object.entries(getPageContentSlotLabels(pageKey)).map(([key, label]) => ({ key, label }));

  return (
    <PageEditorWorkspace
      pageKey={pageKey}
      pageTitle={PAGE_META[pageKey].title}
      publicHref={PAGE_META[pageKey].publicHref}
      initialContent={content}
      initialLayout={layout}
      initialItems={items}
      fields={fields}
      slots={slots}
      versions={versions}
      shopItems={shopItems.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        costPence: item.costPence,
        deliveryType: item.deliveryType,
        quantityTracked: item.quantityTracked,
        quantity: item.quantity ?? null,
      }))}
    />
  );
}
