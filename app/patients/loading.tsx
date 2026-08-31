import { SkeletonCard, SkeletonTable } from "@/components/skeleton";

export default function Loading(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading...
      </p>
      <div className="mt-6 space-y-3">
        <SkeletonCard />
        <SkeletonTable />
      </div>
    </main>
  );
}
