/**
 * Renders INSIDE the (app) layout shell — reports skeleton in the app-wide
 * theme (§14): display heading, filter card, table pulses.
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading reports…
      </p>
      <div className="mt-4 h-8 w-72 animate-pulse rounded-full bg-gray-200" />
      <div className="mt-6 animate-pop-in rounded-3xl bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-12 animate-pulse rounded-full bg-surface" />
            </div>
          ))}
          <div className="h-12 w-32 animate-pulse rounded-full bg-accent/20" />
        </div>
      </div>
      <div className="mt-5 animate-pop-in space-y-2 rounded-3xl bg-white p-4 shadow-soft [animation-delay:160ms]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-full bg-surface px-4 py-3">
            <span className="h-3 w-28 animate-pulse rounded bg-gray-200" />
            <span className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
