/**
 * Renders INSIDE the (app) layout shell — staff list skeleton in the
 * app-wide theme (§14): display heading, card, pill-row pulses.
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading staff…
      </p>
      <div className="mt-4 h-8 w-56 animate-pulse rounded-full bg-gray-200" />
      <div className="mt-6 animate-pop-in space-y-2 rounded-3xl bg-white p-4 shadow-soft">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-full bg-surface px-4 py-3">
            <span className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            <span className="h-3 w-44 animate-pulse rounded bg-gray-200" />
            <span className="ml-auto h-6 w-20 animate-pulse rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
