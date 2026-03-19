"use client";

import { Button, Input, Textarea } from "@heroui/react";
import { useState, type FormEvent } from "react";

type Props = {
  initialName: string;
  initialEmail: string;
};

const inputClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)]",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "text-[color:var(--theme-text-soft)]",
};

const textareaClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)]",
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
    <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
      <h2 className="home-page-text !mb-6 text-white">Request Admin Access</h2>
      <p className="text-sm text-[color:var(--theme-text-muted)]">
        Explain which admin section you need and why. This request can only be sent by a signed-in user.
      </p>

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
        minRows={5}
        isRequired
        placeholder="I need access to the Users page to manage staff accounts..."
        classNames={textareaClassNames}
      />

      <Button type="submit" color="primary" className="w-full" isLoading={isSubmitting}>
        Contact Admin
      </Button>
      {submitMessage ? <p className="text-sm text-[color:var(--theme-text-soft)]">{submitMessage}</p> : null}
    </form>
  );
}
