import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getShopItemById } from "@/lib/site-data";

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

export default async function ShopItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const item = await getShopItemById(itemId);

  if (!item) {
    notFound();
  }

  return (
    <section className="page-shell !max-w-none px-0 md:px-0">
      <div className="page-panel !max-w-none !rounded-none border-x-0 border-b-0 border-t-[1px] px-5 py-6 text-white md:px-8 md:py-10 xl:px-14 xl:py-14">
        <div className="mx-auto w-full max-w-[120rem]">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              Back to Shop
            </Link>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--theme-accent)] md:text-sm">
              Item Detail
            </p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(28rem,0.8fr)] 2xl:grid-cols-[minmax(0,1.35fr)_minmax(32rem,0.75fr)]">
            <div className="theme-card rounded-[2.5rem] p-5 md:p-8 xl:p-10">
              <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] bg-[color:var(--theme-surface-soft)] p-5 md:min-h-[42rem] xl:min-h-[56rem] xl:p-8">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={2200}
                  height={1800}
                  unoptimized
                  className="h-auto max-h-[52rem] w-auto max-w-full rounded-[1.6rem] object-contain xl:max-h-[64rem]"
                />
              </div>
            </div>

            <article className="theme-card rounded-[2.5rem] p-7 md:p-8 xl:p-10">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--theme-accent)] md:text-sm">
                  {item.deliveryType === "digital" ? "Digital Item" : "Postal Item"}
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl xl:text-[3.75rem]">
                  {item.title}
                </h1>
                <p className="mt-5 text-3xl font-semibold text-[color:var(--theme-accent)] md:text-4xl">
                  {formatPrice(item.costPence)}
                </p>
                <p className="mt-7 max-w-2xl text-base leading-8 text-[color:var(--theme-text-muted)] xl:text-lg">
                  Review the delivery method, time, and current availability before continuing to checkout.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[1.6rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-5 md:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-text-muted)] md:text-xs">
                    Delivery Type
                  </p>
                  <p className="mt-3 text-xl font-medium leading-8 text-white">
                    {item.deliveryType === "digital" ? "Digital delivery" : "Postal delivery"}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-5 md:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-text-muted)] md:text-xs">
                    Delivery Time
                  </p>
                  <p className="mt-3 text-xl font-medium leading-8 text-white">{item.deliveryTime}</p>
                </div>
                <div className="rounded-[1.6rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-5 md:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-text-muted)] md:text-xs">
                    Availability
                  </p>
                  <p className="mt-3 text-xl font-medium leading-8 text-white">
                    {item.quantityTracked
                      ? item.quantity && item.quantity > 0
                        ? `${item.quantity} available`
                        : "Currently out of stock"
                      : "Available while listed"}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
