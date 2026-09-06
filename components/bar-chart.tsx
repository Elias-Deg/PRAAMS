/**
 * Dependency-free bar chart (div bars) for dashboard overviews.
 * Native `title` tooltips give per-bar values; zero JS.
 */
export function BarChart({
  data,
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  ariaLabel: string;
}): React.ReactElement {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div role="img" aria-label={`${ariaLabel}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
      <div className="flex h-36 items-end gap-1.5">
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${d.value}`}
            className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1"
          >
            <span className="text-[10px] font-semibold text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
              {d.value}
            </span>
            <div
              className="w-full rounded-t-full bg-navy transition-colors group-hover:bg-navy-light"
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 text-center text-[9px] text-gray-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
