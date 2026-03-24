"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Textarea, addToast } from "@heroui/react";
import { adminFetch } from "@/app/components/admin-session-client";
import PageEditorCanvas from "@/app/components/page-editor-canvas";
import { PageEditorProvider, usePageEditor } from "@/app/components/page-editor-provider";
import type { PageBuiltinLayoutMap, PageContentItemRecord, PageContentVersionRecord, PageKey } from "@/lib/page-content";

type FieldDefinition = {
  key: string;
  label: string;
  multiline?: boolean;
};

type PageSlot = {
  key: string;
  label: string;
};

type ShopItemPreview = {
  id: string;
  title: string;
  imageUrl: string;
  costPence: number;
  deliveryType: "post" | "digital";
  quantityTracked: boolean;
  quantity?: number | null;
};

type Props = {
  pageKey: PageKey;
  pageTitle: string;
  publicHref: string;
  initialContent: Record<string, string>;
  initialLayout: PageBuiltinLayoutMap;
  initialItems: PageContentItemRecord[];
  fields: FieldDefinition[];
  slots: PageSlot[];
  versions: PageContentVersionRecord[];
  shopItems?: ShopItemPreview[];
};

type ItemDraft = {
  id?: string;
  slotKey: string;
  title: string;
  body: string;
  imageUrl: string;
  linkLabel: string;
  linkHref: string;
};

const classNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)]",
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
  innerWrapper: "![color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
  trigger:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)]",
  value: "text-[color:var(--theme-text)]",
  popoverContent: "bg-[color:var(--theme-surface-strong-soft)] text-[color:var(--theme-text)]",
  listbox: "text-[color:var(--theme-text)]",
};

function toDraft(item?: PageContentItemRecord, fallbackSlot?: string): ItemDraft {
  return {
    id: item?.id,
    slotKey: item?.slotKey ?? fallbackSlot ?? "",
    title: item?.title ?? "",
    body: item?.body ?? "",
    imageUrl: item?.imageUrl ?? "",
    linkLabel: item?.linkLabel ?? "",
    linkHref: item?.linkHref ?? "",
  };
}

function formatVersionTimestamp(iso: string) {
  return new Date(iso).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function WorkspaceBody({
  pageKey,
  pageTitle,
  publicHref,
  initialContent,
  fields,
  slots,
  versions,
  shopItems = [],
}: Omit<Props, "initialItems" | "initialLayout">) {
  const router = useRouter();
  const {
    contentDraft,
    setContentDraft,
    layoutDraft,
    items,
    setItems,
    hasCopyChanges,
    hasBuiltinLayoutChanges,
    hasLayoutChanges,
    resetCopy,
    resetLayout,
  } = usePageEditor();
  const [itemDraft, setItemDraft] = useState<ItemDraft>(toDraft(undefined, slots[0]?.key));
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);

  const hasUnsavedChanges = hasCopyChanges || hasBuiltinLayoutChanges || hasLayoutChanges;

  const resetItemDraft = () => {
    setEditingItemId(null);
    setItemDraft(toDraft(undefined, slots[0]?.key));
  };

  const handleStageItem = () => {
    const title = itemDraft.title.trim();
    const body = itemDraft.body.trim();

    if (!itemDraft.slotKey) {
      addToast({ title: "Placement required", description: "Choose where the item should appear.", color: "warning" });
      return;
    }

    if (!title || !body) {
      addToast({ title: "Item incomplete", description: "Title and body are required.", color: "warning" });
      return;
    }

    const nextItem: PageContentItemRecord = {
      id: editingItemId ?? `draft_${crypto.randomUUID()}`,
      pageKey,
      slotKey: itemDraft.slotKey,
      title,
      body,
      imageUrl: itemDraft.imageUrl.trim() || undefined,
      linkLabel: itemDraft.linkLabel.trim() || undefined,
      linkHref: itemDraft.linkHref.trim() || undefined,
      displayOrder: 0,
    };

    setItems((current) => {
      const base = editingItemId ? current.filter((item) => item.id !== editingItemId) : [...current];
      const targetItems = base.filter((item) => item.slotKey === nextItem.slotKey);
      const nextOrder = targetItems.length;
      const merged = [...base, { ...nextItem, displayOrder: nextOrder }];
      return merged.sort((a, b) => a.slotKey.localeCompare(b.slotKey) || a.displayOrder - b.displayOrder);
    });

    addToast({
      title: editingItemId ? "Item updated in draft" : "Item added to draft",
      description: "The change is staged locally. Publish to apply it to the page.",
      color: "success",
    });
    resetItemDraft();
  };

  const handleDeleteDraftItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      resetItemDraft();
    }
    addToast({
      title: "Item removed from draft",
      description: "Publish changes to make the removal live.",
      color: "success",
    });
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const response = await adminFetch("/api/admin/page-content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey,
          content: contentDraft,
          layout: layoutDraft,
          items,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to publish page content.");
      }

      addToast({
        title: "Changes published",
        description: `${pageTitle} has been updated and a new version has been stored.`,
        color: "success",
      });
      router.refresh();
    } catch (error) {
      addToast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Failed to publish page content.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setIsRestoringId(versionId);
    try {
      const response = await adminFetch(`/api/admin/page-content/versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to restore version.");
      }

      addToast({
        title: "Version restored",
        description: "The selected version has been republished.",
        color: "success",
      });
      router.refresh();
    } catch (error) {
      addToast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Failed to restore version.",
        color: "danger",
      });
    } finally {
      setIsRestoringId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[128rem] px-4 py-6 md:px-6 xl:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] px-5 py-4 shadow-[0_24px_80px_color-mix(in_srgb,var(--theme-shadow)_12%,transparent)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--theme-accent)]">Page Studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--theme-text)]">{pageTitle}</h1>
          <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">Edit on a dedicated canvas. Nothing goes live until you publish.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button as="a" href={publicHref} variant="flat">Back To Page</Button>
          <Button variant="flat" isDisabled={!hasUnsavedChanges} onPress={() => { resetCopy(); resetLayout(); resetItemDraft(); }}>
            Reset Draft
          </Button>
          <Button color="primary" isDisabled={!hasUnsavedChanges} isLoading={isSaving} onPress={() => void handlePublish()}>
            Publish Changes
          </Button>
        </div>
      </div>

      <div className="page-editor-studio-stage rounded-[2rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] px-3 py-3 shadow-[0_40px_120px_color-mix(in_srgb,var(--theme-shadow)_14%,transparent)]">
        <PageEditorCanvas pageKey={pageKey} initialContent={initialContent} shopItems={shopItems} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)]">
        <section className="theme-card rounded-[1.75rem] p-5 md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">Built-in Content</p>
            <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">Use the mouse on the canvas to drag existing title and copy blocks into a new order. Edit their content here.</p>
          </div>
          <div className="space-y-4">
            {fields.map((field) =>
              field.multiline ? (
                <Textarea
                  key={field.key}
                  label={field.label}
                  minRows={4}
                  value={contentDraft[field.key] ?? ""}
                  classNames={classNames}
                  onValueChange={(value) => setContentDraft((current) => ({ ...current, [field.key]: value }))}
                />
              ) : (
                <Input
                  key={field.key}
                  label={field.label}
                  value={contentDraft[field.key] ?? ""}
                  classNames={classNames}
                  onValueChange={(value) => setContentDraft((current) => ({ ...current, [field.key]: value }))}
                />
              ),
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="theme-card rounded-[1.75rem] p-5 md:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">Custom Items</p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">Add, edit, remove, and drag items directly on the canvas. All changes stay in draft until publish.</p>
            </div>

            <div className="space-y-4">
              <Select
                label="Placement"
                selectedKeys={itemDraft.slotKey ? [itemDraft.slotKey] : []}
                classNames={classNames}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys).map(String);
                  setItemDraft((current) => ({ ...current, slotKey: value ?? "" }));
                }}
              >
                {slots.map((slot) => (
                  <SelectItem key={slot.key}>{slot.label}</SelectItem>
                ))}
              </Select>
              <Input label="Item title" value={itemDraft.title} classNames={classNames} onValueChange={(value) => setItemDraft((current) => ({ ...current, title: value }))} />
              <Textarea label="Item body" minRows={4} value={itemDraft.body} classNames={classNames} onValueChange={(value) => setItemDraft((current) => ({ ...current, body: value }))} />
              <Input label="Image URL (optional)" value={itemDraft.imageUrl} classNames={classNames} onValueChange={(value) => setItemDraft((current) => ({ ...current, imageUrl: value }))} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Link label (optional)" value={itemDraft.linkLabel} classNames={classNames} onValueChange={(value) => setItemDraft((current) => ({ ...current, linkLabel: value }))} />
                <Input label="Link href (optional)" value={itemDraft.linkHref} classNames={classNames} onValueChange={(value) => setItemDraft((current) => ({ ...current, linkHref: value }))} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button color="primary" onPress={handleStageItem}>{editingItemId ? "Update Draft Item" : "Add Draft Item"}</Button>
              <Button variant="flat" onPress={resetItemDraft}>Reset Item Form</Button>
            </div>

            <div className="mt-5 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-[color:var(--theme-text-muted)]">No custom items in this draft yet.</p>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="rounded-[1.25rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-accent)]">{slots.find((slot) => slot.key === item.slotKey)?.label ?? item.slotKey}</p>
                        <p className="mt-2 text-lg font-semibold text-[color:var(--theme-text)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">{item.body}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="flat" onPress={() => { setItemDraft(toDraft(item)); setEditingItemId(item.id); }}>
                          Edit
                        </Button>
                        <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteDraftItem(item.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="theme-card rounded-[1.75rem] p-5 md:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">Version History</p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">Every publish creates a snapshot. Restore any previous published state from here.</p>
            </div>

            <div className="space-y-3">
              {versions.map((version) => (
                <article key={version.id} className="rounded-[1.25rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--theme-text)]">{version.label ?? "Published version"}</p>
                      <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">{formatVersionTimestamp(version.createdAt)}</p>
                      {version.createdByIdentifier ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--theme-text-soft)]">{version.createdByIdentifier}</p>
                      ) : null}
                    </div>
                    <Button size="sm" variant="flat" isLoading={isRestoringId === version.id} onPress={() => void handleRestore(version.id)}>
                      Restore
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function PageEditorWorkspace(props: Props) {
  return (
    <PageEditorProvider
      initialContent={props.initialContent}
      initialLayout={props.initialLayout}
      initialItems={props.initialItems}
      canEdit={true}
    >
      <WorkspaceBody {...props} />
    </PageEditorProvider>
  );
}

