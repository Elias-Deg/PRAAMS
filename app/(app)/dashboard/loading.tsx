import { SkeletonCard } from "@/components/skeleton";

/**
 * Renders INSIDE the (app) layout shell — the persistent dark sidebar and
 * top bar stay visible and these skeletons already wear the dashboard-v2
 * card grid (§14).
 */
export default function Loading(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading dashboard…
      </p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
