"use client";

import { type ReactNode } from "react";
import { usePageEditor } from "@/app/components/page-editor-provider";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export default function EditablePageRegion({ label, children, className = "" }: Props) {
  const { canEdit, isEditorOpen, setIsEditorOpen } = usePageEditor();

  return (
    <div className={`editable-page-region${canEdit ? " is-manageable" : ""}${isEditorOpen ? " is-editor-open" : ""}${className ? ` ${className}` : ""}`}>
      {canEdit ? (
        <button
          type="button"
          className="editable-page-region-trigger"
          onClick={() => setIsEditorOpen(true)}
        >
          Edit {label}
        </button>
      ) : null}
      {children}
    </div>
  );
}
