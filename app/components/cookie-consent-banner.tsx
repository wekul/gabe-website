"use client";

import { Button } from "@heroui/react";
import { useSyncExternalStore } from "react";

const CONSENT_COOKIE = "cookie_consent";
const CONSENT_STORAGE_KEY = "cookie_consent";
const CONSENT_EVENT = "cookie-consent-change";

type ConsentState = "accepted" | "declined" | "unknown";

function readCookie(name: string) {
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeConsent(value: Exclude<ConsentState, "unknown">) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function getConsentSnapshot(): ConsentState {
  if (typeof document === "undefined") {
    return "unknown";
  }

  const cookieValue = readCookie(CONSENT_COOKIE);
  if (cookieValue === "accepted" || cookieValue === "declined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, cookieValue);
    return cookieValue;
  }

  const storageValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (storageValue === "accepted" || storageValue === "declined") {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(storageValue)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
    return storageValue;
  }

  return "unknown";
}

function subscribeToConsentChange(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener(CONSENT_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener("visibilitychange", onStoreChange);

  return () => {
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener("visibilitychange", onStoreChange);
  };
}

export default function CookieConsentBanner() {
  const consentState = useSyncExternalStore(
    subscribeToConsentChange,
    getConsentSnapshot,
    () => "unknown",
  );

  if (consentState === "accepted" || consentState === "declined") {
    return null;
  }

  return (
    <div className="cookie-banner theme-card">
      <div className="cookie-banner-copy">
        <p className="cookie-banner-title">Cookie Notice</p>
        <p className="cookie-banner-text">
          This site uses cookies for analytics and visitor tracking. You can accept or decline non-essential tracking.
        </p>
      </div>
      <div className="cookie-banner-actions">
        <Button
          variant="flat"
          className="cookie-banner-button cookie-banner-button-secondary"
          onPress={() => {
            writeConsent("declined");
          }}
        >
          Decline
        </Button>
        <Button
          color="primary"
          className="cookie-banner-button"
          onPress={() => {
            writeConsent("accepted");
          }}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
