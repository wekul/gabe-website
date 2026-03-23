import Link from "next/link";
import { listShopItems } from "@/lib/site-data";
import ShopCardImage from "@/app/components/shop-card-image";

export const dynamic = "force-dynamic";

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

function getBadgeText(item: {
  deliveryType: "post" | "digital";
  quantityTracked: boolean;
  quantity?: number;
}) {
  if (item.deliveryType === "digital") {
    return "Digital Edition";
  }

  if (item.quantityTracked && (!item.quantity || item.quantity < 3)) {
    return "Limited Stock";
  }

  return "Available Now";
}

export default async function ShopPage() {
  const items = await listShopItems();

  return (
    <section className="public-shell !max-w-none">
      <div className="public-panel w-full text-[color:var(--theme-text)]">
        <div className="mx-auto w-full max-w-[120rem] px-1 md:px-3">
          <div className="mb-10 text-center">
            <p className="public-kicker !mb-3">Selected Works</p>
            <h2 className="mx-auto max-w-[10ch] text-4xl font-semibold tracking-[-0.05em] text-[color:var(--theme-text)] md:text-5xl xl:text-6xl">
              Shop
            </h2>
          </div>

          {items.length === 0 ? (
            <p className="mx-auto max-w-2xl text-center text-base leading-8 text-[color:var(--theme-text-muted)]">
              No items are available yet.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link key={item.id} href={`/shop/${item.id}`} className="group block text-center">
                  <article>
                    <div className="relative overflow-hidden rounded-[1.6rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-3 shadow-[0_20px_60px_color-mix(in_srgb,var(--theme-shadow)_18%,transparent)] transition-transform duration-200 group-hover:-translate-y-1">
                      <div className="absolute left-6 top-6 z-10 rounded-full border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--theme-text)] shadow-[0_4px_12px_color-mix(in_srgb,var(--theme-shadow)_12%,transparent)]">
                        {getBadgeText(item)}
                      </div>
                      <div className="overflow-hidden rounded-[1.25rem] bg-[color:var(--theme-surface-strong-soft)]">
                        <ShopCardImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-[26rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:h-[32rem] xl:h-[34rem]"
                        />
                      </div>
                    </div>

                    <div className="px-3 pb-2 pt-5">
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--theme-text)] underline decoration-[color:var(--theme-accent)] underline-offset-[0.16em]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xl font-semibold text-[color:var(--theme-accent)]">
                        {formatPrice(item.costPence)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
