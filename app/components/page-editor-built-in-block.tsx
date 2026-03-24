"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { usePageEditor } from "@/app/components/page-editor-provider";
import { PAGE_BUILTIN_POSITION_DEFAULTS } from "@/lib/page-content-shared";

type Props = {
  regionKey: string;
  blockKey: string;
  label: string;
  pageKey: "home" | "contact" | "shop";
  children: ReactNode;
};

export default function PageEditorBuiltInBlock({ pageKey, regionKey, blockKey, label, children }: Props) {
  const { canEdit, layoutDraft, moveBuiltInBlockToPosition } = usePageEditor();
  const [isDragging, setIsDragging] = useState(false);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const position = layoutDraft[regionKey]?.[blockKey];
  const defaults = PAGE_BUILTIN_POSITION_DEFAULTS[pageKey] as Record<string, Record<string, { x: number; y: number }>>;
  const defaultPosition = defaults[regionKey]?.[blockKey];

  if (!position || !defaultPosition) {
    return null;
  }

  if (!canEdit) {
    return <div className="page-editor-built-in-static">{children}</div>;
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const block = blockRef.current;
    const container = block?.parentElement;
    if (!block || !container) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = position.x;
    const initialY = position.y;
    const rect = container.getBoundingClientRect();

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
      moveBuiltInBlockToPosition(regionKey, blockKey, {
        x: initialX + deltaX,
        y: initialY + deltaY,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  return (
    <div
      ref={blockRef}
      className={`page-editor-built-in-block page-editor-built-in-block--${regionKey}-${blockKey}${isDragging ? " is-dragging" : ""}`}
      style={{ left: `${position.x - defaultPosition.x}%`, top: `${position.y - defaultPosition.y}%` }}
    >
      <button type="button" className="page-editor-built-in-handle" onPointerDown={handlePointerDown}>
        Drag {label}
      </button>
      <div className="page-editor-built-in-content">{children}</div>
    </div>
  );
}
