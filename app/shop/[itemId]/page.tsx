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
      <div className="w-full border-t border-white/10 bg-[color:var(--theme-surface-strong-soft)] px-4 py-4 text-white md:px-8 md:py-6 xl:px-10">
        <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-4 text-sm font-semibold uppercase tracking-[0.12em] text-white/90">
          <Link href="/shop" className="inline-flex items-center gap-3 hover:text-white">
            <span className="text-3xl leading-none">←</span>
            <span>Back to Shop</span>
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] xl:items-start">
          <div className="overflow-hidden rounded-[1.5rem] bg-[color:var(--theme-surface-soft)]">
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
              <h1 className="text-4xl font-bold uppercase tracking-[-0.03em] text-white md:text-5xl xl:text-[4rem]">
                {item.title}
              </h1>
              <p className="mt-2 text-2xl font-semibold uppercase tracking-[0.02em] text-white/95 md:text-3xl">
                {formatPrice(item.costPence)}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xl font-bold uppercase text-white md:text-2xl">
                  Delivery Type: {item.deliveryType === "digital" ? "Digital" : "Post"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xl font-bold uppercase text-white md:text-2xl">
                  Delivery Time: {item.deliveryTime}
                </p>
                <p className="mt-3 text-base font-semibold text-white/80 underline underline-offset-4">
                  Availability: {availabilityText}
                </p>
              </div>

              <div>
                <p className="mb-3 text-xl font-bold uppercase text-white md:text-2xl">Quantity</p>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="inline-flex w-fit items-center overflow-hidden rounded-md border border-white bg-black text-xl font-bold text-white">
                    <span className="px-5 py-3 text-white/75">−</span>
                    <span className="border-x border-white/15 px-7 py-3">1</span>
                    <span className="px-5 py-3 text-white/75">+</span>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[3.9rem] min-w-[15rem] items-center justify-center rounded-xl bg-[linear-gradient(90deg,#1f3aa8_0%,#b21f1f_52%,#cf9921_100%)] px-8 py-3 text-center text-2xl font-bold uppercase tracking-[0.04em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                  >
                    Purchase Enquiry
                  </Link>
                </div>
              </div>
            </div>

            <details open className="rounded-md border border-white/80 bg-black px-7 py-5">
              <summary className="cursor-pointer list-none text-2xl font-bold text-white">
                Description
              </summary>
              <div className="mt-6 space-y-5 text-lg font-medium leading-9 text-white/82">
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
