import { Suspense } from "react";
import LoginForm from "@/app/components/login-form";

function LoginFallback() {
  return (
    <div className="page-panel">
      <p className="text-sm text-[color:var(--theme-text-soft)]">Loading login form...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="page-shell">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
