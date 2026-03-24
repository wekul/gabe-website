"use client";

import ErrorScreen from "@/app/components/error-screen";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} />;
}
