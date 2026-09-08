/**
 * Dependency-free grouped bar chart (dashboard v2): two series per day —
 * booked (light blue) vs completed (navy) — with a light y-axis, dashed
 * gridlines and native-title tooltips. No chart library.
 */
export function GroupedBars({
  data,
  ariaLabel,
}: {
  data: { label: string; booked: number; completed: number }[];
  ariaLabel: string;
}): React.ReactElement {
  const max = Math.max(1, ...data.map((d) => Math.max(d.booked, d.completed)));
  const nice = max <= 5 ? 5 : max <= 10 ? 10 : Math.ceil(max / 5) * 5;
  const ticks = [
    nice,
    Math.round(nice * 0.75),
    Math.round(nice * 0.5),
    Math.round(nice * 0.25),
    0,
  ];

  return (
    <div
      role="img"
      aria-label={`${ariaLabel}: ${data
        .map((d) => `${d.label} booked ${d.booked}, completed ${d.completed}`)
        .join("; ")}`}
    >
      <div className="flex">
        <div
          aria-hidden
          className="flex w-7 shrink-0 flex-col justify-between pb-px text-right text-[10px] font-medium text-gray-400"
        >
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="relative h-40 min-w-0 flex-1 border-b border-gray-200">
          {[100, 75, 50, 25].map((p) => (
            <div
              key={p}
              aria-hidden
              className="absolute inset-x-0 border-t border-dashed border-gray-100"
              style={{ top: `${100 - p}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-1 px-1">
            {data.map((d) => (
              <div
                key={d.label}
                title={`${d.label} — booked ${d.booked} · completed ${d.completed}`}
                className="flex h-full items-end gap-1"
              >
                <div
                  className="w-2.5 rounded-t-sm bg-accent-light transition-colors hover:bg-accent"
                  style={{ height: `${Math.max(2, (d.booked / nice) * 100)}%` }}
                />
                <div
                  className="w-2.5 rounded-t-sm bg-navy transition-colors hover:bg-navy-light"
                  style={{ height: `${Math.max(2, (d.completed / nice) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex gap-1 pl-7">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 text-center text-[10px] text-gray-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}