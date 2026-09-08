import Link from "next/link";

import { addisDateKey, addisTimeLabel, mondayOf } from "@/lib/time";

import { STATUS_BLOCK, type ScheduleEvent } from "./time-grid";

/**
 * Compact month view (§14 schedule design): Monday-start grid, pastel chips
 * per day (up to three + "more"), today ringed, cells link to the Day view.
 */
export function MonthGrid({
  anchor,
  events,
  today,
}: {
  anchor: string;
  events: ScheduleEvent[];
  today: string;
}): React.ReactElement {
  const first = `${anchor.slice(0, 7)}-01`;
  const gridStart = mondayOf(first);
  const byDay = new Map<string, ScheduleEvent[]>();
  for (const e of events) {
    const k = addisDateKey(e.date_time);
    const list = byDay.get(k) ?? [];
    list.push(e);
    byDay.set(k, list);
  }
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${first}T00:00:00Z`));

  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <p className="sr-only">{label}</p>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 42 }, (_, i) => {
          const key = new Date(Date.parse(`${gridStart}T00:00:00Z`) + i * 86_400_000)
            .toISOString()
            .slice(0, 10);
          const inMonth = key.slice(0, 7) === anchor.slice(0, 7);
          const isToday = key === today;
          const isSunday = new Date(`${key}T00:00:00Z`).getUTCDay() === 0;
          const rows = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[96px] rounded-2xl border p-1.5 ${
                inMonth ? "border-gray-100 bg-white" : "border-transparent bg-gray-50/60"
              } ${isToday ? "ring-2 ring-accent" : ""}`}
            >
              <div className="flex items-center justify-between px-0.5">
                <Link
                  href={`/appointments?view=day&date=${key}`}
                  aria-label={`Open ${key}`}
                  className={`text-xs font-bold ${
                    isToday
                      ? "grid h-5 w-5 place-items-center rounded-full bg-accent text-white"
                      : inMonth
                        ? "text-gray-700 hover:text-navy hover:underline"
                        : "text-gray-300"
                  }`}
                >
                  {Number(key.slice(8))}
                </Link>
                {isSunday && inMonth && (
                  <span className="text-[8px] font-semibold uppercase text-gray-300">
                    Closed
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {rows.slice(0, 3).map((row) => (
                  <Link
                    key={row.id}
                    href={`/appointments/${row.id}`}
                    title={`${addisTimeLabel(row.date_time)} · ${
                      row.patient?.full_name ?? "Unknown"
                    }`}
                    className={`block truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${
                      STATUS_BLOCK[row.status]
                    }`}
                  >
                    {addisTimeLabel(row.date_time)}{" "}
                    {row.patient?.full_name.split(" ")[0] ?? "?"}
                  </Link>
                ))}
                {rows.length > 3 && (
                  <Link
                    href={`/appointments?view=day&date=${key}`}
                    className="block px-1 text-[10px] font-semibold text-navy hover:underline"
                  >
                    +{rows.length - 3} more
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
