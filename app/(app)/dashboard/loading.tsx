import { SkeletonCard } from "@/components/skeleton";

/**
 * Renders INSIDE the (app) layout shell — the kpi tiles + card grid shape
 * shared by all three role dashboards (§14), popping in with the same
 * staggered spring as the real cards.
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading dashboard…
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pop-in rounded-3xl bg-white p-4 shadow-soft"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div className="animate-pop-in" style={{ animationDelay: "160ms" }}>
            <SkeletonCard />
          </div>
          <div className="animate-pop-in" style={{ animationDelay: "260ms" }}>
            <SkeletonCard />
          </div>
        </div>
        <div className="space-y-5">
          <div className="animate-pop-in" style={{ animationDelay: "200ms" }}>
            <SkeletonCard />
          </div>
          <div className="animate-pop-in" style={{ animationDelay: "300ms" }}>
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
