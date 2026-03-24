"use client";

import { Button, Input, RadioGroup, Textarea, Radio, addToast } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { usePageEditor } from "@/app/components/page-editor-provider";

type Props = {
  submitLabel: string;
  submitLabelFieldKey?: string;
};

const inputClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl",
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
  innerWrapper: "![color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
};

const textareaClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl",
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
  label: "text-[color:var(--theme-text-soft)]",
};

export default function ContactForm({ submitLabel, submitLabelFieldKey }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const { contentDraft } = usePageEditor();
  const resolvedSubmitLabel = submitLabelFieldKey ? (contentDraft[submitLabelFieldKey] ?? submitLabel) : submitLabel;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const message = String(formData.get("message") ?? "");
    const reason = String(formData.get("contactReason") ?? "");

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, reason }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        const errorMessage = errorBody.error ?? "Failed to send message.";
        setSubmitMessage(errorMessage);
        addToast({
          title: "Message not sent",
          description: errorMessage,
          color: "danger",
        });
        return;
      }

      form.reset();
      addToast({
        title: "Message submitted",
        description: "Your contact form has been sent successfully.",
        color: "success",
      });
    } catch {
      setSubmitMessage("Failed to send message.");
      addToast({
        title: "Message not sent",
        description: "Failed to send message.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="theme-card w-full rounded-[1.75rem] p-5 md:p-6 xl:p-7" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <Input label="Name" name="name" type="text" isRequired classNames={inputClassNames} />
        <Input label="Email" name="email" type="email" isRequired classNames={inputClassNames} />
        <Textarea label="Message" name="message" minRows={7} isRequired classNames={textareaClassNames} />
        <RadioGroup label="Reason for contact" name="contactReason" defaultValue="general_query" isRequired>
          <Radio value="general_query">General Query</Radio>
          <Radio value="purchasing_query">Purchasing Query</Radio>
        </RadioGroup>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button type="submit" color="primary" className="min-w-[11rem]" isLoading={isSubmitting}>
            {resolvedSubmitLabel}
          </Button>
          {submitMessage ? (
            <p className="text-sm text-[color:var(--theme-text-soft)]">{submitMessage}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
