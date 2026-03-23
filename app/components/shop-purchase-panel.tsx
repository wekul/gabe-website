"use client";

import Link from "next/link";
import { addToast } from "@heroui/react";
import { useMemo, useState } from "react";

type Props = {
  itemId: string;
  quantityTracked: boolean;
  availableQuantity?: number;
};

export default function ShopPurchasePanel({ itemId, quantityTracked, availableQuantity }: Props) {
  const maxQuantity = useMemo(() => {
    if (!quantityTracked) {
      return 99;
    }

    return Math.max(availableQuantity ?? 0, 0);
  }, [availableQuantity, quantityTracked]);

  const [quantity, setQuantity] = useState(quantityTracked ? Math.min(Math.max(maxQuantity, 1), 1) : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOutOfStock = quantityTracked && maxQuantity <= 0;

  const decrement = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increment = () => {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  };

  const beginCheckout = async () => {
    if (isSubmitting || isOutOfStock) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.assign(data.url);
    } catch (error) {
      addToast({
        title: "Checkout unavailable",
        description: error instanceof Error ? error.message : "Unable to start checkout.",
        color: "danger",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center overflow-hidden rounded-md border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] text-xl font-bold text-[color:var(--theme-text)]">
          <button
            type="button"
            className="px-5 py-3 text-[color:var(--theme-text-soft)] transition-colors hover:bg-[color:var(--theme-surface-soft)] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={decrement}
            disabled={quantity <= 1 || isOutOfStock || isSubmitting}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="border-x border-[color:var(--theme-border)] px-7 py-3">{quantity}</span>
          <button
            type="button"
            className="px-5 py-3 text-[color:var(--theme-text-soft)] transition-colors hover:bg-[color:var(--theme-surface-soft)] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={increment}
            disabled={quantity >= maxQuantity || isOutOfStock || isSubmitting}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p className="text-sm font-medium text-[color:var(--theme-text-soft)]">
          {isOutOfStock
            ? "Currently out of stock."
            : quantityTracked
              ? `${maxQuantity} ${maxQuantity === 1 ? "piece is" : "pieces are"} currently available.`
              : "Open edition. Choose up to 99 items per checkout."}
        </p>
      </div>

      {isOutOfStock ? (
        <Link
          href="/contact"
          className="inline-flex min-h-[3.9rem] min-w-[15rem] items-center justify-center rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] px-8 py-3 text-center text-xl font-bold uppercase tracking-[0.04em] text-[color:var(--theme-text-soft)]"
        >
          Contact
        </Link>
      ) : (
        <button
          type="button"
          onClick={beginCheckout}
          disabled={isSubmitting}
          className="inline-flex min-h-[3.9rem] min-w-[15rem] items-center justify-center rounded-xl border border-[color:var(--theme-accent-strong)] bg-[color:var(--theme-accent-soft)] px-8 py-3 text-center text-2xl font-bold uppercase tracking-[0.04em] text-[color:var(--theme-text)] shadow-[0_18px_40px_color-mix(in_srgb,var(--theme-shadow)_18%,transparent)] transition-colors hover:bg-[color:var(--theme-accent)] disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Redirecting..." : "Purchase"}
        </button>
      )}
    </div>
  );
}
