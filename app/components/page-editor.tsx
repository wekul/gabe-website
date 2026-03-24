"use client";

import { Button, Input, Select, SelectItem, Textarea, addToast } from "@heroui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/app/components/admin-session-client";
import type { PageContentItemRecord } from "@/lib/page-content";
import { usePageEditor } from "@/app/components/page-editor-provider";

type FieldDefinition = {
  key: string;
  label: string;
  multiline?: boolean;
};

type PageSlot = {
  key: string;
  label: string;
};

type Props = {
  pageKey: string;
  title: string;
  fields: FieldDefinition[];
  initialContent: Record<string, string>;
  slots: PageSlot[];
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

export default function PageEditor({
  pageKey,
  title,
  fields,
  initialContent,
  slots,
}: Props) {
  const router = useRouter();
  const {
    canEdit,
    isEditorOpen,
    setIsEditorOpen,
    contentDraft,
    setContentDraft,
    hasCopyChanges,
    resetCopy,
    items,
    setItems,
    hasLayoutChanges,
    resetLayout,
  } = usePageEditor();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(toDraft(undefined, slots[0]?.key));
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const changedKeys = useMemo(
    () => fields.filter((field) => (contentDraft[field.key] ?? "") !== (initialContent[field.key] ?? "")),
    [contentDraft, fields, initialContent],
  );

  if (!canEdit) {
    return null;
  }

  const resetItemDraft = () => {
    setEditingItemId(null);
    setItemDraft(toDraft(undefined, slots[0]?.key));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await Promise.all(
        changedKeys.map((field) =>
          adminFetch("/api/admin/page-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageKey,
              blockKey: field.key,
              value: contentDraft[field.key] ?? "",
            }),
          }).then(async (response) => {
            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
              throw new Error(data.error ?? `Failed to save ${field.label}.`);
            }
          }),
        ),
      );

      addToast({
        title: "Page updated",
        description: `${title} content has been saved.`,
        color: "success",
      });
      router.refresh();
    } catch (error) {
      addToast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save page content.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);

    try {
      await Promise.all(
        items.map((item, index) =>
          adminFetch(`/api/admin/page-content/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageKey: item.pageKey,
              slotKey: item.slotKey,
              title: item.title,
              body: item.body,
              imageUrl: item.imageUrl,
              linkLabel: item.linkLabel,
              linkHref: item.linkHref,
              displayOrder: item.displayOrder ?? index,
            }),
          }).then(async (response) => {
            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
              throw new Error(data.error ?? `Failed to save layout for ${item.title}.`);
            }
          }),
        ),
      );

      addToast({
        title: "Layout saved",
        description: `${title} item order has been updated.`,
        color: "success",
      });
      router.refresh();
    } catch (error) {
      addToast({
        title: "Layout save failed",
        description: error instanceof Error ? error.message : "Failed to save layout.",
        color: "danger",
      });
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      const response = await adminFetch(`/api/admin/page-content/items${editingItemId ? `/${editingItemId}` : ""}`, {
        method: editingItemId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, ...itemDraft }),
      });
      const data = (await response.json()) as { error?: string; item?: PageContentItemRecord };

      if (!response.ok || !data.item) {
        throw new Error(data.error ?? "Failed to save item.");
      }

      addToast({
        title: editingItemId ? "Item updated" : "Item added",
        description: `${data.item.title} has been saved.`,
        color: "success",
      });
      router.refresh();
      setItems((current) => {
        const next = editingItemId
          ? current.map((item) => (item.id === data.item?.id ? data.item : item))
          : [...current, data.item!];
        return next.sort((a, b) => a.slotKey.localeCompare(b.slotKey) || a.displayOrder - b.displayOrder);
      });
      resetItemDraft();
    } catch (error) {
      addToast({
        title: "Item save failed",
        description: error instanceof Error ? error.message : "Failed to save item.",
        color: "danger",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await adminFetch(`/api/admin/page-content/items/${itemId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete item.");
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
      addToast({ title: "Item deleted", description: "The page item has been removed.", color: "success" });
      router.refresh();
      if (editingItemId === itemId) {
        resetItemDraft();
      }
    } catch (error) {
      addToast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete item.",
        color: "danger",
      });
    }
  };

  return (
    <>
      <div className="page-editor-trigger-wrap">
        <Button className="page-editor-trigger" onPress={() => setIsEditorOpen(true)}>
          Edit Page
        </Button>
      </div>

      {isEditorOpen ? (
        <div className="page-editor-overlay">
          <div className="page-editor-drawer">
            <div className="page-editor-header">
              <div>
                <p className="page-editor-kicker">Live Editor</p>
                <h2 className="page-editor-title">{title}</h2>
              </div>
              <Button variant="flat" className="page-editor-close" onPress={() => setIsEditorOpen(false)}>
                Close
              </Button>
            </div>

            <div className="page-editor-body">
              <section className="space-y-4">
                <div>
                  <p className="page-editor-section-title">Existing Page Content</p>
                  <p className="page-editor-section-copy">These fields drive the built-in sections already on the page. Changes preview immediately and only persist when you save.</p>
                </div>
                {fields.map((field) =>
                  field.multiline ? (
                    <Textarea
                      key={field.key}
                      label={field.label}
                      minRows={4}
                      value={contentDraft[field.key] ?? ""}
                      classNames={classNames}
                      onValueChange={(value) => {
                        setContentDraft((current) => ({ ...current, [field.key]: value }));
                      }}
                    />
                  ) : (
                    <Input
                      key={field.key}
                      label={field.label}
                      value={contentDraft[field.key] ?? ""}
                      classNames={classNames}
                      onValueChange={(value) => {
                        setContentDraft((current) => ({ ...current, [field.key]: value }));
                      }}
                    />
                  ),
                )}
              </section>

              <section className="space-y-4 border-t border-[color:var(--theme-border)] pt-6">
                <div>
                  <p className="page-editor-section-title">Custom Page Items</p>
                  <p className="page-editor-section-copy">Add repeatable content sections, then drag them on the live page to preview the layout before saving.</p>
                </div>

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

                <div className="flex flex-wrap gap-3">
                  <Button color="primary" onPress={() => void handleSaveItem()}>
                    {editingItemId ? "Update Item" : "Add Item"}
                  </Button>
                  <Button variant="flat" onPress={resetItemDraft}>Reset Item Form</Button>
                </div>

                <div className="rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] px-4 py-3 text-sm text-[color:var(--theme-text-muted)]">
                  {hasLayoutChanges
                    ? "Layout changes are currently in preview. Dragged items will not persist until you click Save Item Layout."
                    : "Open the live page area and drag items to preview a new order inside each page section."}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button color="secondary" variant="flat" isDisabled={!hasLayoutChanges} onPress={resetLayout}>
                    Reset Layout Draft
                  </Button>
                  <Button color="primary" isLoading={isSavingLayout} isDisabled={!hasLayoutChanges} onPress={() => void handleSaveLayout()}>
                    Save Item Layout
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="theme-card rounded-[1.25rem] p-4 text-sm text-[color:var(--theme-text-muted)]">
                      No custom items have been added to this page yet.
                    </div>
                  ) : (
                    items.map((item) => (
                      <article key={item.id} className="theme-card rounded-[1.25rem] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-accent)]">
                              {slots.find((slot) => slot.key === item.slotKey)?.label ?? item.slotKey}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[color:var(--theme-text)]">{item.title}</p>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">{item.body}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="flat" onPress={() => { setItemDraft(toDraft(item)); setEditingItemId(item.id); }}>
                              Edit
                            </Button>
                            <Button size="sm" color="danger" variant="flat" onPress={() => void handleDeleteItem(item.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="page-editor-actions">
              <p className="text-sm text-[color:var(--theme-text-muted)]">
                {hasCopyChanges ? `${changedKeys.length} built-in change(s) ready to save.` : "No unsaved built-in copy changes."}
              </p>
              <div className="flex gap-3">
                <Button variant="flat" onPress={resetCopy}>
                  Reset Existing Content
                </Button>
                <Button color="primary" isLoading={isSaving} isDisabled={!hasCopyChanges} onPress={() => void handleSave()}>
                  Save Existing Content
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
