/** Shared loading skeleton — matches the card/table language of real screens. */
export function SkeletonCard(): React.ReactElement {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm" aria-hidden>
      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }): React.ReactElement {
  return (
    <div
      className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
      aria-hidden
    >
      <div className="h-10 bg-navy-tint" />
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-3.5">
            <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/6 animate-pulse rounded bg-gray-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}