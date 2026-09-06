"use client";

import { useEffect, useState } from "react";

/**
 * Auto-dismissing toast for post-redirect confirmations (§5 micro-interactions).
 * Success/error tones; manual dismiss; reduced-motion honored globally.
 */
export function Toast({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error";
}): React.ReactElement | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in fixed bottom-5 right-5 z-50 print:hidden"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border-l-4 bg-white px-4 py-3 shadow-lg ${
          tone === "error" ? "border-status-cancelled" : "border-status-completed"
        }`}
      >
        <span
          aria-hidden
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            tone === "error" ? "bg-status-cancelled" : "bg-status-completed"
          }`}
        />
        <p className="text-sm text-gray-800">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
          className="ml-2 text-lg leading-none text-gray-400 transition-colors hover:text-gray-700 focus-visible:text-gray-700 focus-visible:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
