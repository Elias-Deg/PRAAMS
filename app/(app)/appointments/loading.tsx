/**
 * Renders INSIDE the (app) layout shell — schedule skeleton in the app-wide
 * theme (§14): side panel block, toolbar pill, time-grid area.
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row">
      <p className="sr-only" aria-live="polite">
        Loading schedule…
      </p>
      <div className="w-full shrink-0 space-y-4 lg:w-64">
        <div className="h-64 animate-pop-in rounded-3xl bg-white shadow-soft" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="h-8 w-40 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-4 h-14 animate-pop-in rounded-3xl bg-white shadow-soft [animation-delay:120ms]" />
        <div className="mt-4 h-[620px] animate-pop-in rounded-3xl bg-white shadow-soft [animation-delay:200ms]" />
      </div>
    </div>
  );
}
