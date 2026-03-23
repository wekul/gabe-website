import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getShopItemById } from "@/lib/site-data";
import ShopPurchasePanel from "@/app/components/shop-purchase-panel";

export const dynamic = "force-dynamic";

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

function getAvailabilityText(quantityTracked: boolean, quantity?: number) {
  if (!quantityTracked) {
    return "Available while listed";
  }

  if (!quantity || quantity <= 0) {
    return "Currently out of stock";
  }

  return `${quantity} available`;
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

  const availabilityText = getAvailabilityText(item.quantityTracked, item.quantity);
  const descriptionParagraphs = item.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="page-shell !max-w-none px-0 md:px-0">
      <div className="w-full border-t border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong-soft)] px-4 py-4 text-[color:var(--theme-text)] md:px-8 md:py-6 xl:px-10">
        <div className="mb-8 flex items-center gap-4 border-b border-[color:var(--theme-border)] pb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--theme-text-soft)]">
          <Link href="/shop" className="inline-flex items-center gap-3 transition-colors hover:text-[color:var(--theme-text)]">
            <span className="text-3xl leading-none">←</span>
            <span>Back to Shop</span>
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] xl:items-start">
          <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)]">
            <div className="flex min-h-[34rem] items-center justify-center p-6 md:min-h-[50rem] xl:min-h-[62rem] xl:p-8">
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={2200}
                height={2600}
                unoptimized
                className="h-auto max-h-[58rem] w-auto max-w-full object-contain"
              />
            </div>
          </div>

          <article className="flex flex-col gap-6 xl:pt-2">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-[-0.03em] text-[color:var(--theme-text)] md:text-5xl xl:text-[4rem]">
                {item.title}
              </h1>
              <p className="mt-2 text-2xl font-semibold uppercase tracking-[0.02em] text-[color:var(--theme-accent)] md:text-3xl">
                {formatPrice(item.costPence)}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xl font-bold uppercase text-[color:var(--theme-text)] md:text-2xl">
                  Delivery Type: {item.deliveryType === "digital" ? "Digital" : "Post"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xl font-bold uppercase text-[color:var(--theme-text)] md:text-2xl">
                  Delivery Time: {item.deliveryTime}
                </p>
                <p className="mt-3 text-base font-semibold text-[color:var(--theme-text-soft)] underline underline-offset-4">
                  Availability: {availabilityText}
                </p>
              </div>

              <div>
                <p className="mb-3 text-xl font-bold uppercase text-[color:var(--theme-text)] md:text-2xl">Quantity</p>
                <ShopPurchasePanel
                  itemId={item.id}
                  quantityTracked={item.quantityTracked}
                  availableQuantity={item.quantity}
                />
              </div>
            </div>

            <details open className="rounded-md border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-7 py-5">
              <summary className="cursor-pointer list-none text-2xl font-bold text-[color:var(--theme-text)]">
                Description
              </summary>
              <div className="mt-6 space-y-5 text-lg font-medium leading-9 text-[color:var(--theme-text-soft)]">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                ) : (
                  <p>No description has been added for this item yet.</p>
                )}
              </div>
            </details>
          </article>
        </div>
      </div>
    </section>
  );
}
