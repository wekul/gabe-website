import Link from "next/link";
import Image from "next/image";
import { listShopItems } from "@/lib/site-data";

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

export default async function ShopPage() {
  const items = await listShopItems();

  return (
    <section className="page-shell">
      <div className="page-panel text-white">
        <div className="mb-8 max-w-3xl">
          <h2 className="home-page-text !mb-4">Shop</h2>
          <p className="text-base leading-7 text-[color:var(--theme-text-muted)]">
            Browse available items and open any card for the full product view.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="text-base leading-7 text-[color:var(--theme-text-muted)]">
            No items are available yet.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <Link key={item.id} href={`/shop/${item.id}`} className="group block">
                <article className="theme-card h-full overflow-hidden rounded-[1.75rem] p-5 transition-transform duration-200 group-hover:-translate-y-1 md:p-6">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-72 w-full rounded-[1.4rem] object-cover"
                  />
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <p className="text-2xl font-semibold tracking-tight text-white">{item.title}</p>
                      <p className="text-lg font-semibold text-[color:var(--theme-accent)]">
                        {formatPrice(item.costPence)}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--theme-text-muted)]">
                      {item.deliveryType === "digital" ? "Digital delivery" : "Postal delivery"} • {item.deliveryTime}
                    </p>
                    {item.quantityTracked ? (
                      <p className="text-sm text-[color:var(--theme-text-muted)]">
                        {item.quantity && item.quantity > 0 ? `${item.quantity} in stock` : "Out of stock"}
                      </p>
                    ) : null}
                    <p className="pt-2 text-sm font-medium text-white/80">Open item page</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
