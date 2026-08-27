"use client";

import { useEffect } from "react";

import { INACTIVITY_TIMEOUT_MS, LAST_ACTIVE_COOKIE } from "@/lib/constants";

/**
 * Records operator activity into a timestamp cookie consumed by proxy.ts.
 * Throttled to one write per 15s of continuous activity. Mounted globally —
 * it writes nothing privileged, just "when the browser was last touched".
 */
export function IdleCookieWatcher(): null {
  useEffect(() => {
    let lastWritten = 0;

    const write = (): void => {
      const now = Date.now();
      if (now - lastWritten < 15_000) return;
      lastWritten = now;
      document.cookie =
        `${LAST_ACTIVE_COOKIE}=${now}` +
        `; path=/; samesite=lax; max-age=${Math.ceil((INACTIVITY_TIMEOUT_MS / 1000) * 2)}`;
    };

    write(); // mount counts as activity, so brand-new sessions are never flagged stale

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "focus",
    ];
    events.forEach((event) => window.addEventListener(event, write, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, write));
    };
  }, []);

  return null;
}