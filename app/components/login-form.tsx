"use client";

import { Button, Input } from "@heroui/react";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

const fieldClassNames = {
  inputWrapper:
    "bg-[color:var(--theme-surface-soft)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)] border border-[color:var(--theme-border)] rounded-2xl",
  input: "!text-white caret-white",
  innerWrapper: "!text-white",
  label: "text-[color:var(--theme-text-soft)]",
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl,
      redirect: false,
    });

    if (!result || result.error) {
      setIsLoading(false);
      setError("Invalid username/email or password.");
      return;
    }

    const deviceSessionResponse = await fetch("/api/auth/device-session", {
      method: "POST",
    });

    setIsLoading(false);

    if (!deviceSessionResponse.ok) {
      await signOut({ redirect: false });
      setError("Login succeeded, but the device session could not be started.");
      return;
    }

    window.location.href = result.url ?? callbackUrl;
  };

  return (
    <div className="public-layout">
      <div className="max-w-3xl">
        <p className="public-kicker">Private Access</p>
        <h2 className="public-title">Admin Login</h2>
        <p className="public-copy">
          Sign in with your assigned username or email to access the admin workspace.
        </p>
      </div>

      <form className="public-form-panel compact space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Username or Email"
          name="username"
          type="text"
          isRequired
          classNames={fieldClassNames}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          isRequired
          classNames={fieldClassNames}
        />
        <Button type="submit" color="primary" className="w-full sm:w-auto" isLoading={isLoading}>
          Sign In
        </Button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </div>
  );
}
