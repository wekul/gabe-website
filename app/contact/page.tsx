"use client";

import { Button, Input, RadioGroup, Textarea, Radio, addToast } from "@heroui/react";
import { useState, type FormEvent } from "react";

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
    <section className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full max-w-6xl px-4 py-10 md:px-6 xl:px-8">
      <div className="grid w-full gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] xl:items-start">
        <div className="max-w-2xl pt-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--theme-accent)]">
            Correspondence
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl xl:text-6xl">
            Contact
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[color:var(--theme-text-muted)] md:text-lg">
            Use this form for purchase enquiries or general communication. Messages are routed directly into the site admin panel.
          </p>
        </div>

        <form
          className="theme-card w-full rounded-[1.75rem] p-5 md:p-6 xl:p-7"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <Input label="Name" name="name" type="text" isRequired classNames={inputClassNames} />
            <Input label="Email" name="email" type="email" isRequired classNames={inputClassNames} />
            <Textarea
              label="Message"
              name="message"
              minRows={7}
              isRequired
              classNames={textareaClassNames}
            />
            <RadioGroup
              label="Reason for contact"
              name="contactReason"
              defaultValue="general_query"
              isRequired
            >
              <Radio value="general_query">General Query</Radio>
              <Radio value="purchasing_query">Purchasing Query</Radio>
            </RadioGroup>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button type="submit" color="primary" className="min-w-[11rem]" isLoading={isSubmitting}>
                Send Message
              </Button>
              {submitMessage ? (
                <p className="text-sm text-[color:var(--theme-text-soft)]">{submitMessage}</p>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

