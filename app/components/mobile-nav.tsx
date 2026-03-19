"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

function subscribe() {
  return () => {};
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted, isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) {
        setIsProfileMenuOpen(false);
      }

      return !prev;
    });
  };

  const toggleButton = (isOverlayButton = false) => (
    <button
      type="button"
      className={`mobile-nav-toggle${isOpen ? " is-open" : ""}${isOverlayButton ? " mobile-nav-toggle-overlay" : ""}`}
      style={
        isOverlayButton
          ? {
              position: "fixed",
              top: "calc((var(--header-height) - 2.75rem) / 2)",
              right: "1rem",
              zIndex: 60,
            }
          : undefined
      }
      aria-expanded={isOpen}
      aria-controls="mobile-nav-panel"
      onClick={handleToggle}
    >
      <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
      <span className="mobile-nav-line" />
      <span className="mobile-nav-line" />
      <span className="mobile-nav-line" />
    </button>
  );

  const panel = (
    <div
      id="mobile-nav-panel"
      className={`mobile-nav-panel${isOpen ? " is-open" : ""}`}
    >
      {toggleButton(true)}

      <div className="mobile-nav-links">
        <Link href="/" onClick={() => {
          setIsProfileMenuOpen(false);
          setIsOpen(false);
        }}>
          Home
        </Link>
        <Link href="/contact" onClick={() => {
          setIsProfileMenuOpen(false);
          setIsOpen(false);
        }}>
          Contact
        </Link>
        <Link href="/shop" onClick={() => {
          setIsProfileMenuOpen(false);
          setIsOpen(false);
        }}>
          Shop
        </Link>
        <a href="https://github.com/wekul" onClick={() => {
          setIsProfileMenuOpen(false);
          setIsOpen(false);
        }}>
          Developer
        </a>
      </div>

      {isAuthenticated ? (
        <div className="mobile-nav-account-menu">
          <button
            type="button"
            className={`mobile-nav-profile-button${isProfileMenuOpen ? " is-open" : ""}`}
            aria-expanded={isProfileMenuOpen}
            aria-controls="mobile-nav-profile-actions"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
          >
            <span className="sr-only">Open profile menu</span>
            <span className="mobile-nav-profile-icon" aria-hidden="true">
              <span className="mobile-nav-profile-head" />
              <span className="mobile-nav-profile-body" />
            </span>
          </button>

          {isProfileMenuOpen ? (
            <div id="mobile-nav-profile-actions" className="mobile-nav-profile-actions">
              <Link href="/admin" onClick={() => {
                setIsProfileMenuOpen(false);
                setIsOpen(false);
              }}>
                Admin
              </Link>
              <button
                type="button"
                className="mobile-nav-profile-action danger"
                onClick={async () => {
                  setIsOpen(false);
                  await fetch("/api/auth/device-session", { method: "DELETE" });
                  void signOut({ callbackUrl: "/login" });
                }}
              >
                Log Out
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <Link
          href="/login"
          className="mobile-nav-account-link"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsOpen(false);
          }}
        >
          Login
        </Link>
      )}
    </div>
  );

  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {!isOpen ? toggleButton() : null}

      {isMounted ? createPortal(panel, document.body) : null}
    </nav>
  );
}
