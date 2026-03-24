"use client";

import { usePageEditor } from "@/app/components/page-editor-provider";

type Props = {
  fieldKey: string;
  initialValue: string;
};

export default function EditablePageValue({ fieldKey, initialValue }: Props) {
  const { contentDraft } = usePageEditor();
  return <>{contentDraft[fieldKey] ?? initialValue}</>;
}
