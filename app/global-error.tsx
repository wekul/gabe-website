"use client";

import ErrorScreen from "@/app/components/error-screen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
