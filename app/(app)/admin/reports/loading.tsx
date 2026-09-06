import { SkeletonCard, SkeletonTable } from "@/components/skeleton";

/**
 * Renders INSIDE the (app) layout shell — the persistent sidebar stays visible
 * and these skeletons already wear the final design (§6 soft language).
 */
export default function Loading(): React.ReactElement {
  return (
    <>
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading...
      </p>
      <div className="mt-6 space-y-3">
        <SkeletonCard />
        <SkeletonTable />
      </div>
    </>
  );
}
