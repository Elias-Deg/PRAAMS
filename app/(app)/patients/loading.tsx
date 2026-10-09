/**
 * Renders INSIDE the (app) layout shell — skeleton wearing the register's
 * gradient hero, pill search and pill rows (§14).
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading patients…
      </p>
      <div className="mt-5 h-36 animate-pop-in rounded-3xl bg-gradient-to-br from-accent/70 to-accent-light/70" />
      <div className="mt-5 h-14 animate-pop-in rounded-full bg-white shadow-soft [animation-delay:120ms]" />
      <div className="mt-5 animate-pop-in space-y-2 rounded-3xl bg-white p-4 shadow-soft [animation-delay:200ms]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-full bg-surface px-4 py-3"
          >
            <span className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            <span className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <span className="ml-auto h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
