"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  error: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorScreen({ error, reset }: Props) {
  const pathname = usePathname();
  const [canViewDetails, setCanViewDetails] = useState(false);
  const [checkedViewerAccess, setCheckedViewerAccess] = useState(false);
  const hasReported = useRef(false);

  useEffect(() => {
    let active = true;

    void fetch("/api/critical-errors/access", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ canViewCriticalErrors?: boolean }>)
      .then((data) => {
        if (!active) {
          return;
        }

        setCanViewDetails(Boolean(data.canViewCriticalErrors));
        setCheckedViewerAccess(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setCanViewDetails(false);
        setCheckedViewerAccess(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hasReported.current) {
      return;
    }

    hasReported.current = true;

    void fetch("/api/critical-errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "app_error_boundary",
        path: pathname,
        message: error.message,
        stack: error.stack ?? null,
        digest: error.digest ?? null,
      }),
    }).catch(() => undefined);
  }, [error.digest, error.message, error.stack, pathname]);

  return (
    <div className="critical-error-screen">
      <div className="critical-error-panel">
        <p className="critical-error-kicker">Critical Error</p>
        <h1 className="critical-error-title">{canViewDetails ? "Application error" : "An error has occurred."}</h1>
        <p className="critical-error-copy">
          {canViewDetails
            ? "This failure has been logged and marked as critical. Review the details below before retrying."
            : "An error has occurred. The site administrator has been notified."}
        </p>

        {canViewDetails && checkedViewerAccess ? (
          <div className="critical-error-details">
            <p><strong>Path:</strong> {pathname || "/"}</p>
            <p><strong>Message:</strong> {error.message}</p>
            {error.digest ? <p><strong>Digest:</strong> {error.digest}</p> : null}
            {error.stack ? <pre>{error.stack}</pre> : null}
          </div>
        ) : null}

        <div className="critical-error-actions">
          {reset ? (
            <button type="button" className="critical-error-button" onClick={() => reset()}>
              Try again
            </button>
          ) : null}
          <Link href="/" className="critical-error-button critical-error-button-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
