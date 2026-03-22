import { Suspense } from "react";
import LoginForm from "@/app/components/login-form";

function LoginFallback() {
  return (
    <div className="public-form-panel compact">
      <p className="text-sm text-[color:var(--theme-text-soft)]">Loading login form...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="public-shell">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
