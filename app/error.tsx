"use client";

/** Route-level error boundary (brief §12: error states everywhere). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  // Never surface raw error details to staff (NFR-02/NFR-09); digest only.
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-status-cancelled">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-bold text-navy">This view failed to load</h1>
      <p className="mt-3 text-sm text-gray-600">
        The problem has been contained to this screen. Try again, and if it keeps
        happening, note this reference for support:{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
          {error.digest ?? "N/A"}
        </code>
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-sm bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Try again
      </button>
    </main>
  );
}
