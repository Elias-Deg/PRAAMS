/**
 * Renders INSIDE the (app) layout shell — skeleton wearing the patient
 * detail's gradient hero, detail tiles and timeline (§14).
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="h-9 w-40 animate-pulse rounded-full bg-gray-200" />
      <div className="mt-4 h-40 animate-pop-in rounded-3xl bg-gradient-to-br from-accent/70 to-accent-light/70" />
      <div className="mt-5 animate-pop-in rounded-3xl bg-white p-5 shadow-soft [animation-delay:160ms]">
        <div className="h-3 w-36 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
      <div className="mt-5 animate-pop-in space-y-3 rounded-3xl bg-white p-5 shadow-soft [animation-delay:240ms]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
