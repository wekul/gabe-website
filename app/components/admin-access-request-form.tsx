"use client";

import { Button, Input, Textarea } from "@heroui/react";
import { useState, type FormEvent } from "react";

type Props = {
  initialName: string;
  initialEmail: string;
};

const inputClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "text-[color:var(--theme-text-soft)]",
};

const textareaClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl",
  input: "!text-white caret-white",
  label: "text-[color:var(--theme-text-soft)]",
};

export default function AdminAccessRequestForm({ initialName, initialEmail }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const message = String(formData.get("message") ?? "");

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: `[Admin access request]\n\n${message}`,
          adminMessage: true,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        setSubmitMessage(errorBody.error ?? "Failed to send request.");
        return;
      }

      form.reset();
      setSubmitMessage("Request sent.");
    } catch {
      setSubmitMessage("Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="public-form-panel compact space-y-5" onSubmit={handleSubmit}>
      <Input
        label="Name"
        name="name"
        type="text"
        isRequired
        defaultValue={initialName}
        classNames={inputClassNames}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        isRequired
        defaultValue={initialEmail}
        classNames={inputClassNames}
      />
      <Textarea
        label="Request"
        name="message"
        minRows={6}
        isRequired
        placeholder="I need access to the Users page to manage staff accounts..."
        classNames={textareaClassNames}
      />

      <Button type="submit" color="primary" className="w-full sm:w-auto" isLoading={isSubmitting}>
        Contact Admin
      </Button>
      {submitMessage ? <p className="text-sm text-[color:var(--theme-text-soft)]">{submitMessage}</p> : null}
    </form>
  );
}
