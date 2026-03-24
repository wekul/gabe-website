"use client";

import { Input, RadioGroup, Radio, Textarea, Button } from "@heroui/react";
import EditablePageValue from "@/app/components/editable-page-value";

type Props = {
  submitLabel: string;
  submitLabelFieldKey?: string;
};

const inputClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl opacity-80",
  input: "![color:var(--theme-text)]",
  innerWrapper: "![color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
};

const textareaClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl opacity-80",
  input: "![color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
};

export default function ContactFormPreview({ submitLabel, submitLabelFieldKey }: Props) {
  return (
    <div className="theme-card w-full rounded-[1.75rem] p-5 md:p-6 xl:p-7">
      <div className="space-y-5">
        <Input isDisabled label="Name" value="Preview only" classNames={inputClassNames} />
        <Input isDisabled label="Email" value="preview@example.com" classNames={inputClassNames} />
        <Textarea isDisabled label="Message" minRows={7} value="This is a non-interactive preview of the contact form inside the page editor." classNames={textareaClassNames} />
        <RadioGroup isDisabled label="Reason for contact" defaultValue="general_query">
          <Radio value="general_query">General Query</Radio>
          <Radio value="purchasing_query">Purchasing Query</Radio>
        </RadioGroup>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button color="primary" className="min-w-[11rem]" isDisabled>
            {submitLabelFieldKey ? <EditablePageValue fieldKey={submitLabelFieldKey} initialValue={submitLabel} /> : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
