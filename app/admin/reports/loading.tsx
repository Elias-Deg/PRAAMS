import { SkeletonCard, SkeletonTable } from "@/components/skeleton";

/** Shell-consistent loading state: navy sidebar placeholder + skeletons. */
export default function Loading(): React.ReactElement {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[248px_1fr]">
      <aside aria-hidden className="hidden bg-navy lg:block lg:h-dvh" />
      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl flex-1 px-6 py-10"
      >
        <p className="text-sm text-gray-500" aria-live="polite">
          Loading…
        </p>
        <div className="mt-6 space-y-3">
          <SkeletonCard />
          <SkeletonTable />
        </div>
      </main>
    </div>
  );
}
