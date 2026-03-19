"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function createVisitorId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getCookieValue(name: string) {
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setVisitorCookie(value: string) {
  const maxAge = 60 * 60 * 24 * 365 * 2;
  document.cookie = `visitor_id=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getVisitorId() {
  const key = "visitor_id";
  const cookieValue = getCookieValue(key);

  if (cookieValue) {
    window.localStorage.setItem(key, cookieValue);
    return cookieValue;
  }

  const storageValue = window.localStorage.getItem(key);
  if (storageValue) {
    setVisitorCookie(storageValue);
    return storageValue;
  }

  const generated = createVisitorId();
  window.localStorage.setItem(key, generated);
  setVisitorCookie(generated);
  return generated;
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string | null>(null);
  const lastScrollBucketRef = useRef(0);
  const lastBucketChangeAtRef = useRef(0);
  const maxStillMsRef = useRef(0);
  const stillByBucketRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const visitorId = getVisitorId();
    visitorIdRef.current = visitorId;
    let active = true;
    const imageViewStartMs = new Map<string, number>();

    const sendImageView = (imageId: string, viewedMs: number) => {
      const activeVisitorId = visitorIdRef.current;
      if (!activeVisitorId) {
        return;
      }

      const viewedSeconds = Math.round(viewedMs / 1000);
      if (viewedSeconds < 1) {
        return;
      }

      void fetch("/api/track/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          imageId,
          visitorId: activeVisitorId,
          path: pathname || "/",
          viewedSeconds,
        }),
      });
    };

    const getScrollBucket = () => Math.round(window.scrollY / 200) * 200;

    const resetPointTracking = () => {
      lastScrollBucketRef.current = getScrollBucket();
      lastBucketChangeAtRef.current = Date.now();
      maxStillMsRef.current = 0;
      stillByBucketRef.current = {};
    };

    const commitCurrentBucketDuration = () => {
      const now = Date.now();
      const duration = now - lastBucketChangeAtRef.current;
      const bucket = lastScrollBucketRef.current;

      stillByBucketRef.current[bucket] =
        (stillByBucketRef.current[bucket] ?? 0) + duration;
      maxStillMsRef.current = Math.max(maxStillMsRef.current, duration);
      lastBucketChangeAtRef.current = now;
    };

    const start = async () => {
      try {
        const response = await fetch("/api/track/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            path: pathname || "/",
          }),
        });

        if (!response.ok || !active) {
          return;
        }

        const data = (await response.json()) as { sessionId?: string };
        sessionIdRef.current = data.sessionId ?? null;
        resetPointTracking();
      } catch {
        sessionIdRef.current = null;
      }
    };

    const endCurrentSession = () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        return;
      }

      commitCurrentBucketDuration();
      const bucketDurations = stillByBucketRef.current;
      const topBucketEntry = Object.entries(bucketDurations).sort(
        (a, b) => b[1] - a[1],
      )[0];
      const topStillPoint = topBucketEntry
        ? `Scroll Y ~ ${topBucketEntry[0]}px`
        : undefined;

      const payload = JSON.stringify({
        sessionId,
        maxStillSeconds: Math.round(maxStillMsRef.current / 1000),
        topStillPoint,
      });
      navigator.sendBeacon("/api/track/end", payload);
      sessionIdRef.current = null;
    };

    const flushImageViews = () => {
      const now = Date.now();
      for (const [imageId, startedAt] of imageViewStartMs.entries()) {
        sendImageView(imageId, now - startedAt);
      }
      imageViewStartMs.clear();
    };

    const onScroll = () => {
      const bucket = getScrollBucket();
      if (bucket === lastScrollBucketRef.current) {
        return;
      }

      commitCurrentBucketDuration();
      lastScrollBucketRef.current = bucket;
    };

    const trackedImages = Array.from(
      document.querySelectorAll<HTMLElement>("[data-track-image]"),
    );

    const imageObserver = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const entry of entries) {
          const imageId = entry.target.getAttribute("data-track-image");
          if (!imageId) {
            continue;
          }

          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
          const startedAt = imageViewStartMs.get(imageId);

          if (isVisible && startedAt == null) {
            imageViewStartMs.set(imageId, now);
          }

          if (!isVisible && startedAt != null) {
            sendImageView(imageId, now - startedAt);
            imageViewStartMs.delete(imageId);
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );

    trackedImages.forEach((imageEl) => imageObserver.observe(imageEl));

    start();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushImageViews();
        endCurrentSession();
      }
    };

    const onBeforeUnload = () => {
      flushImageViews();
      endCurrentSession();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("scroll", onScroll);
      imageObserver.disconnect();
      flushImageViews();
      endCurrentSession();
    };
  }, [pathname]);

  return null;
}
