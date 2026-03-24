"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { PageContentItemRecord } from "@/lib/page-content";
import { usePageEditor } from "@/app/components/page-editor-provider";

type Props = {
  slotKey: string;
};

export default function PageContentItems({ slotKey }: Props) {
  const { items, canEdit, isEditorOpen, moveItemToSlotPosition } = usePageEditor();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isSlotActive, setIsSlotActive] = useState(false);

  const slotItems = items
    .filter((item: PageContentItemRecord) => item.slotKey === slotKey)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const isEditable = canEdit && isEditorOpen;

  const resolveDraggedItemId = (event: React.DragEvent<HTMLElement>) => event.dataTransfer.getData("text/plain") || draggedItemId;

  if (!slotItems.length && !isEditable) {
    return null;
  }

  return (
    <div
      className={`page-content-items${isEditable ? " is-editable" : ""}${isSlotActive ? " is-slot-active" : ""}`}
      onDragOver={(event) => {
        if (!isEditable) {
          return;
        }
        event.preventDefault();
        setIsSlotActive(true);
      }}
      onDragLeave={() => setIsSlotActive(false)}
      onDrop={(event) => {
        if (!isEditable) {
          return;
        }

        event.preventDefault();
        const nextDraggedItemId = resolveDraggedItemId(event);
        if (!nextDraggedItemId) {
          setIsSlotActive(false);
          return;
        }

        moveItemToSlotPosition(nextDraggedItemId, slotKey);
        setDraggedItemId(null);
        setIsSlotActive(false);
      }}
    >
      {isEditable ? (
        <div className="page-content-slot-note">
          {slotItems.length === 0 ? "Drop an item here" : "Drag items to reorder or move them into this section"}
        </div>
      ) : null}

      {slotItems.map((item, index) => (
        <article
          key={item.id}
          className={`page-content-item theme-card${draggedItemId === item.id ? " is-dragging" : ""}${isEditable ? " is-editable" : ""}`}
          draggable={isEditable}
          onDragStart={(event) => {
            setDraggedItemId(item.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", item.id);
          }}
          onDragEnd={() => {
            setDraggedItemId(null);
            setIsSlotActive(false);
          }}
          onDragOver={(event) => {
            if (!isEditable) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            if (!isEditable) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            const nextDraggedItemId = resolveDraggedItemId(event);
            if (!nextDraggedItemId) {
              return;
            }

            moveItemToSlotPosition(nextDraggedItemId, slotKey, index);
            setDraggedItemId(null);
            setIsSlotActive(false);
          }}
        >
          {isEditable ? (
            <div className="page-content-item-handle">Drag with mouse to move</div>
          ) : null}
          {item.imageUrl ? (
            <div className="page-content-item-image-wrap">
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={1200}
                height={900}
                className="page-content-item-image"
              />
            </div>
          ) : null}
          <div className="page-content-item-copy">
            <h3 className="page-content-item-title">{item.title}</h3>
            <p className="page-content-item-body">{item.body}</p>
            {item.linkLabel && item.linkHref ? (
              <Link href={item.linkHref} className="public-link secondary">
                {item.linkLabel}
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
