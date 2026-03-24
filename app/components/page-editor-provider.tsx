"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PageBuiltinLayoutMap, PageBuiltinPosition } from "@/lib/page-content-shared";
import type { PageContentItemRecord } from "@/lib/page-content";

type ContextValue = {
  canEdit: boolean;
  isEditorOpen: boolean;
  setIsEditorOpen: (value: boolean) => void;
  initialContent: Record<string, string>;
  contentDraft: Record<string, string>;
  setContentDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  hasCopyChanges: boolean;
  resetCopy: () => void;
  initialLayout: PageBuiltinLayoutMap;
  layoutDraft: PageBuiltinLayoutMap;
  setLayoutDraft: React.Dispatch<React.SetStateAction<PageBuiltinLayoutMap>>;
  hasBuiltinLayoutChanges: boolean;
  moveBuiltInBlockToPosition: (regionKey: string, blockKey: string, position: PageBuiltinPosition) => void;
  initialItems: PageContentItemRecord[];
  items: PageContentItemRecord[];
  setItems: React.Dispatch<React.SetStateAction<PageContentItemRecord[]>>;
  hasLayoutChanges: boolean;
  resetLayout: () => void;
  moveItemToSlotPosition: (draggedItemId: string, targetSlotKey: string, targetIndex?: number) => void;
};

const PageEditorContext = createContext<ContextValue | null>(null);

function normalizeOrder(items: PageContentItemRecord[]) {
  const grouped = new Map<string, PageContentItemRecord[]>();

  for (const item of items) {
    const group = grouped.get(item.slotKey) ?? [];
    group.push(item);
    grouped.set(item.slotKey, group);
  }

  const normalized: PageContentItemRecord[] = [];

  for (const [slotKey, slotItems] of grouped) {
    slotItems
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((item, index) => {
        normalized.push({ ...item, slotKey, displayOrder: index });
      });
  }

  return normalized.sort((a, b) => a.slotKey.localeCompare(b.slotKey) || a.displayOrder - b.displayOrder);
}

function areLayoutsEqual(a: PageBuiltinLayoutMap, b: PageBuiltinLayoutMap) {
  const regionKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const regionKey of regionKeys) {
    const aRegion = a[regionKey] ?? {};
    const bRegion = b[regionKey] ?? {};
    const blockKeys = new Set([...Object.keys(aRegion), ...Object.keys(bRegion)]);

    for (const blockKey of blockKeys) {
      const aPosition = aRegion[blockKey];
      const bPosition = bRegion[blockKey];
      if (!aPosition || !bPosition || aPosition.x !== bPosition.x || aPosition.y !== bPosition.y) {
        return false;
      }
    }
  }

  return true;
}

export function PageEditorProvider({
  initialContent,
  initialLayout,
  initialItems,
  canEdit,
  children,
}: {
  initialContent: Record<string, string>;
  initialLayout: PageBuiltinLayoutMap;
  initialItems: PageContentItemRecord[];
  canEdit: boolean;
  children: ReactNode;
}) {
  const normalizedInitial = useMemo(() => normalizeOrder(initialItems), [initialItems]);
  const [contentDraft, setContentDraft] = useState<Record<string, string>>(initialContent);
  const [layoutDraft, setLayoutDraft] = useState<PageBuiltinLayoutMap>(initialLayout);
  const [items, setItems] = useState<PageContentItemRecord[]>(normalizedInitial);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const hasCopyChanges = useMemo(() => {
    const keys = new Set([...Object.keys(initialContent), ...Object.keys(contentDraft)]);
    for (const key of keys) {
      if ((contentDraft[key] ?? "") !== (initialContent[key] ?? "")) {
        return true;
      }
    }
    return false;
  }, [contentDraft, initialContent]);

  const hasBuiltinLayoutChanges = useMemo(() => !areLayoutsEqual(layoutDraft, initialLayout), [initialLayout, layoutDraft]);

  const hasLayoutChanges = useMemo(() => {
    if (items.length !== normalizedInitial.length) {
      return true;
    }

    return items.some((item, index) => {
      const initial = normalizedInitial[index];
      return !initial || initial.id !== item.id || initial.slotKey !== item.slotKey || initial.displayOrder !== item.displayOrder;
    });
  }, [items, normalizedInitial]);

  const value = useMemo<ContextValue>(
    () => ({
      canEdit,
      isEditorOpen,
      setIsEditorOpen,
      initialContent,
      contentDraft,
      setContentDraft,
      hasCopyChanges,
      resetCopy: () => setContentDraft(initialContent),
      initialLayout,
      layoutDraft,
      setLayoutDraft,
      hasBuiltinLayoutChanges,
      moveBuiltInBlockToPosition: (regionKey, blockKey, position) => {
        setLayoutDraft((current) => ({
          ...current,
          [regionKey]: {
            ...(current[regionKey] ?? {}),
            [blockKey]: {
              x: Math.max(0, Math.min(position.x, 92)),
              y: Math.max(0, Math.min(position.y, 92)),
            },
          },
        }));
      },
      initialItems: normalizedInitial,
      items,
      setItems,
      hasLayoutChanges,
      resetLayout: () => {
        setLayoutDraft(initialLayout);
        setItems(normalizedInitial);
      },
      moveItemToSlotPosition: (draggedItemId, targetSlotKey, targetIndex) => {
        setItems((current) => {
          const normalizedCurrent = normalizeOrder(current);
          const draggedItem = normalizedCurrent.find((item) => item.id === draggedItemId);

          if (!draggedItem) {
            return current;
          }

          const grouped = new Map<string, PageContentItemRecord[]>();
          for (const item of normalizedCurrent) {
            if (item.id === draggedItemId) {
              continue;
            }
            const group = grouped.get(item.slotKey) ?? [];
            group.push(item);
            grouped.set(item.slotKey, group);
          }

          const targetGroup = [...(grouped.get(targetSlotKey) ?? [])];
          const insertionIndex = Math.max(0, Math.min(targetIndex ?? targetGroup.length, targetGroup.length));
          targetGroup.splice(insertionIndex, 0, { ...draggedItem, slotKey: targetSlotKey });
          grouped.set(targetSlotKey, targetGroup);

          const nextItems: PageContentItemRecord[] = [];
          for (const [slotKey, slotItems] of grouped) {
            slotItems.forEach((item, index) => {
              nextItems.push({ ...item, slotKey, displayOrder: index });
            });
          }

          return nextItems.sort((a, b) => a.slotKey.localeCompare(b.slotKey) || a.displayOrder - b.displayOrder);
        });
      },
    }),
    [canEdit, contentDraft, hasBuiltinLayoutChanges, hasCopyChanges, hasLayoutChanges, initialContent, initialLayout, isEditorOpen, items, layoutDraft, normalizedInitial],
  );

  return <PageEditorContext.Provider value={value}>{children}</PageEditorContext.Provider>;
}

export function usePageEditor() {
  const context = useContext(PageEditorContext);

  if (!context) {
    throw new Error("usePageEditor must be used within PageEditorProvider.");
  }

  return context;
}
