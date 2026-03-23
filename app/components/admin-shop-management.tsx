"use client";

import Image from "next/image";
import { Button, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import { useMemo, useState, type FormEvent } from "react";
import type { ShopItemRecord } from "@/lib/site-data";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialItems: ShopItemRecord[];
};

type ShopItemDraft = {
  title: string;
  description: string;
  imageUrl: string;
  cost: string;
  deliveryTime: string;
  deliveryType: "post" | "digital";
  quantityTracked: boolean;
  quantity: string;
};

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
  innerWrapper: "![color:var(--theme-text)]",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
  trigger:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] data-[open=true]:bg-[color:var(--theme-surface-soft)]",
  value: "![color:var(--theme-text)]",
  selectorIcon: "text-[color:var(--theme-text-muted)]",
  popoverContent:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong-soft)] text-[color:var(--theme-text)]",
};

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

function sortItems(items: ShopItemRecord[]) {
  return [...items].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function createDraft(item: ShopItemRecord): ShopItemDraft {
  return {
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    cost: (item.costPence / 100).toFixed(2),
    deliveryTime: item.deliveryTime,
    deliveryType: item.deliveryType,
    quantityTracked: item.quantityTracked,
    quantity: String(item.quantity ?? 0),
  };
}

export default function AdminShopManagement({ initialItems }: Props) {
  const [items, setItems] = useState(() => sortItems(initialItems));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [quantityTracked, setQuantityTracked] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ShopItemDraft>>(
    Object.fromEntries(initialItems.map((item) => [item.id, createDraft(item)])),
  );

  const orderedItems = useMemo(() => sortItems(items), [items]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await adminFetch("/api/admin/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          imageUrl: String(formData.get("imageUrl") ?? ""),
          costPence: Math.round(Number(formData.get("cost") ?? 0) * 100),
          deliveryTime: String(formData.get("deliveryTime") ?? ""),
          deliveryType: String(formData.get("deliveryType") ?? "post"),
          quantityTracked,
          quantity: quantityTracked ? Number(formData.get("quantity") ?? 0) : null,
        }),
      });

      const data = (await response.json()) as { error?: string; item?: ShopItemRecord };

      if (!response.ok || !data.item) {
        setStatusMessage(data.error ?? "Failed to add item.");
        return;
      }

      setItems((current) => sortItems([data.item!, ...current]));
      setDrafts((current) => ({ ...current, [data.item!.id]: createDraft(data.item!) }));
      form.reset();
      setQuantityTracked(false);
      setStatusMessage("Item added.");
    } catch {
      setStatusMessage("Failed to add item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDraft = (itemId: string, next: Partial<ShopItemDraft>) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        ...next,
      },
    }));
  };

  const handleSaveItem = async (itemId: string, displayOrder: number) => {
    const draft = drafts[itemId];
    if (!draft) {
      return;
    }

    setBusyItemId(itemId);
    setStatusMessage("");

    try {
      const response = await adminFetch(`/api/admin/shop/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          imageUrl: draft.imageUrl,
          costPence: Math.round(Number(draft.cost || 0) * 100),
          deliveryTime: draft.deliveryTime,
          deliveryType: draft.deliveryType,
          displayOrder,
          quantityTracked: draft.quantityTracked,
          quantity: draft.quantityTracked ? Number(draft.quantity || 0) : null,
        }),
      });

      const data = (await response.json()) as { error?: string; item?: ShopItemRecord };

      if (!response.ok || !data.item) {
        setStatusMessage(data.error ?? "Failed to update item.");
        return;
      }

      setItems((current) =>
        sortItems(current.map((item) => (item.id === itemId ? data.item! : item))),
      );
      setDrafts((current) => ({ ...current, [itemId]: createDraft(data.item!) }));
      setStatusMessage("Item updated.");
    } catch {
      setStatusMessage("Failed to update item.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    setBusyItemId(itemId);
    setStatusMessage("");

    try {
      const response = await adminFetch(`/api/admin/shop/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      const data = (await response.json()) as { error?: string; item?: ShopItemRecord };

      if (!response.ok || !data.item) {
        setStatusMessage(data.error ?? "Failed to move item.");
        return;
      }

      setItems((current) => {
        const sorted = sortItems(current);
        const currentIndex = sorted.findIndex((item) => item.id === itemId);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
          return current;
        }

        const next = [...sorted];
        const currentItem = next[currentIndex];
        const targetItem = next[targetIndex];
        next[currentIndex] = { ...targetItem, displayOrder: currentItem.displayOrder };
        next[targetIndex] = { ...data.item!, displayOrder: targetItem.displayOrder };
        return sortItems(next);
      });
      setStatusMessage(`Item moved ${direction}.`);
    } catch {
      setStatusMessage("Failed to move item.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setBusyItemId(itemId);
    setStatusMessage("");

    try {
      const response = await adminFetch(`/api/admin/shop/${itemId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatusMessage(data.error ?? "Failed to delete item.");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
      setDrafts((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      setStatusMessage("Item deleted.");
    } catch {
      setStatusMessage("Failed to delete item.");
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 text-white md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
            Commerce
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">Shop Management</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Add items for the storefront, reorder how they appear, and maintain delivery, description, or stock settings.
          </p>
        </div>
        {statusMessage ? (
          <div className="theme-status-pill rounded-full px-4 py-2 text-sm text-[color:var(--theme-text-soft)]">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <form className="theme-card mb-6 rounded-[1.5rem] p-5 md:p-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Item Name" name="title" isRequired classNames={fieldClassNames} />
          <Input label="Image URL" name="imageUrl" type="url" isRequired classNames={fieldClassNames} />
          <Input
            label="Cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            isRequired
            description="Stored as GBP."
            classNames={fieldClassNames}
          />
          <Input
            label="Delivery Time"
            name="deliveryTime"
            isRequired
            placeholder="e.g. 3-5 business days"
            classNames={fieldClassNames}
          />
          <Select
            label="Delivery Type"
            name="deliveryType"
            defaultSelectedKeys={["post"]}
            classNames={fieldClassNames}
          >
            <SelectItem key="post">Post</SelectItem>
            <SelectItem key="digital">Digital</SelectItem>
          </Select>
          <div className="theme-card flex items-center justify-between rounded-2xl px-4 py-3">
            <div>
              <p className="font-medium text-white">Track Quantity</p>
              <p className="text-sm text-[color:var(--theme-text-muted)]">
                Toggle stock limits for this item.
              </p>
            </div>
            <Switch isSelected={quantityTracked} color="primary" onValueChange={setQuantityTracked}>
              {quantityTracked ? "Enabled" : "Disabled"}
            </Switch>
          </div>
          {quantityTracked ? (
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              min="0"
              defaultValue="0"
              isRequired
              classNames={fieldClassNames}
            />
          ) : null}
        </div>

        <div className="mt-4">
          <Textarea
            label="Description"
            name="description"
            minRows={6}
            classNames={fieldClassNames}
            placeholder="Describe the work, medium, edition details, or shipping notes."
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" color="primary" isLoading={isSubmitting}>
            Add Item
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {orderedItems.length === 0 ? (
          <div className="theme-card rounded-[1.25rem] p-6 text-[color:var(--theme-text-muted)]">
            No shop items yet.
          </div>
        ) : (
          orderedItems.map((item, index) => {
            const draft = drafts[item.id] ?? createDraft(item);
            const isBusy = busyItemId === item.id;

            return (
              <article key={item.id} className="theme-card rounded-[1.5rem] p-5 md:p-6">
                <div className="mb-4 flex flex-col gap-3 border-b border-[color:var(--theme-border)] pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--theme-accent)]">
                      Position {index + 1}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">{draft.title || "Untitled item"}</p>
                    <p className="text-sm text-[color:var(--theme-text-muted)]">Current price: {formatPrice(item.costPence)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="flat"
                      className="border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] text-[color:var(--theme-text)]"
                      isDisabled={index === 0 || isBusy}
                      onPress={() => {
                        void handleMoveItem(item.id, "up");
                      }}
                    >
                      Move Up
                    </Button>
                    <Button
                      variant="flat"
                      className="border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] text-[color:var(--theme-text)]"
                      isDisabled={index === orderedItems.length - 1 || isBusy}
                      onPress={() => {
                        void handleMoveItem(item.id, "down");
                      }}
                    >
                      Move Down
                    </Button>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
                  <div>
                    <Image
                      src={draft.imageUrl}
                      alt={draft.title || "Shop item image"}
                      width={1000}
                      height={800}
                      unoptimized
                      className="h-64 w-full rounded-[1.25rem] object-cover"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Item Name"
                      value={draft.title}
                      classNames={fieldClassNames}
                      onValueChange={(value) => updateDraft(item.id, { title: value })}
                    />
                    <Input
                      label="Image URL"
                      type="url"
                      value={draft.imageUrl}
                      classNames={fieldClassNames}
                      onValueChange={(value) => updateDraft(item.id, { imageUrl: value })}
                    />
                    <Input
                      label="Cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.cost}
                      description={`Current: ${formatPrice(item.costPence)}`}
                      classNames={fieldClassNames}
                      onValueChange={(value) => updateDraft(item.id, { cost: value })}
                    />
                    <Input
                      label="Delivery Time"
                      value={draft.deliveryTime}
                      classNames={fieldClassNames}
                      onValueChange={(value) => updateDraft(item.id, { deliveryTime: value })}
                    />
                    <Select
                      label="Delivery Type"
                      selectedKeys={[draft.deliveryType]}
                      classNames={fieldClassNames}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0];
                        updateDraft(item.id, {
                          deliveryType: value === "digital" ? "digital" : "post",
                        });
                      }}
                    >
                      <SelectItem key="post">Post</SelectItem>
                      <SelectItem key="digital">Digital</SelectItem>
                    </Select>
                    <div className="theme-card flex items-center justify-between rounded-2xl px-4 py-3">
                      <div>
                        <p className="font-medium text-white">Track Quantity</p>
                        <p className="text-sm text-[color:var(--theme-text-muted)]">
                          {draft.quantityTracked
                            ? `Quantity: ${draft.quantity || "0"}`
                            : "Quantity tracking disabled"}
                        </p>
                      </div>
                      <Switch
                        isSelected={draft.quantityTracked}
                        color="primary"
                        onValueChange={(value) => updateDraft(item.id, { quantityTracked: value })}
                      >
                        {draft.quantityTracked ? "Enabled" : "Disabled"}
                      </Switch>
                    </div>
                    {draft.quantityTracked ? (
                      <Input
                        label="Quantity"
                        type="number"
                        min="0"
                        value={draft.quantity}
                        classNames={fieldClassNames}
                        onValueChange={(value) => updateDraft(item.id, { quantity: value })}
                      />
                    ) : null}
                    <div className="md:col-span-2">
                      <Textarea
                        label="Description"
                        minRows={6}
                        value={draft.description}
                        classNames={fieldClassNames}
                        onValueChange={(value) => updateDraft(item.id, { description: value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    color="primary"
                    isLoading={isBusy}
                    onPress={() => {
                      void handleSaveItem(item.id, item.displayOrder);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    as="a"
                    href={`/shop/${item.id}`}
                    variant="flat"
                    className="border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] text-[color:var(--theme-text)]"
                  >
                    View Item Page
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    className="border border-red-500/30 bg-red-500/10 text-red-100"
                    isLoading={isBusy}
                    onPress={() => {
                      void handleDeleteItem(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

