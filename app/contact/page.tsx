"use client"

import { Button, Input, RadioGroup, Textarea, Radio, addToast } from "@heroui/react";
import { useState, type FormEvent } from "react";

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

export default function ContactPage() {
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
    <section className="page-shell">
      <form className="page-panel space-y-4" onSubmit={handleSubmit}>
        <h2 className="home-page-text !mb-6 text-white">Contact Me</h2>

        <Input label="Name" name="name" type="text" isRequired classNames={inputClassNames} />
        <Input label="Email" name="email" type="email" isRequired classNames={inputClassNames} />
        <Textarea
          label="Message"
          name="message"
          minRows={5}
          isRequired
          classNames={textareaClassNames}
        />
        <RadioGroup label="What is your reason for contacting?" name="contactReason" defaultValue="general_query" isRequired>
          <Radio value="general_query">General Query</Radio>
          <Radio value="purchasing_query">Purchasing Query</Radio>
        </RadioGroup>

        <Button type="submit" color="primary" className="w-full" isLoading={isSubmitting}>
          Send
        </Button>
        {submitMessage ? (
          <p className="text-sm text-[color:var(--theme-text-soft)]">{submitMessage}</p>
        ) : null}
      </form>
    </section>
  );
}
