"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { todayInAddis } from "@/lib/constants";
import { mondayOf } from "@/lib/time";

interface ExtraParams {
  staff?: string;
  status?: string;
  tab?: string;
}

/**
 * Mini month calendar (§14 schedule design): browse months locally, pick a
 * day → jumps to the Day view. Days with appointments get a little dot.
 */
export function MiniCalendar({
  selectedDate,
  eventDays,
  extra,
}: {
  selectedDate: string;
  eventDays: string[];
  extra: ExtraParams;
}): React.ReactElement {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const eventSet = new Set(eventDays);
  const today = todayInAddis();

  const anchor = new Date(`${selectedDate}T00:00:00Z`);
  const viewDate = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + offset, 1),
  );
  const viewISO = viewDate.toISOString().slice(0, 10);
  const gridStart = mondayOf(viewISO);
  const cells = Array.from(
    { length: 42 },
    (_, i) =>
      new Date(Date.parse(`${gridStart}T00:00:00Z`) + i * 86_400_000)
        .toISOString()
        .slice(0, 10),
  );
  const month = viewDate.getUTCMonth();
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(viewDate);

  const pick = (key: string): void => {
    const p = new URLSearchParams({ view: "day", date: key });
    if (extra.staff) p.set("staff", extra.staff);
    if (extra.status) p.set("status", extra.status);
    if (extra.tab) p.set("tab", extra.tab);
    router.push(`/appointments?${p.toString()}`);
  };

  return (
    <section aria-label="Mini calendar" className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold text-gray-900">{label}</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous month"
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
          >
            <Icon name="chevron" className="h-3.5 w-3.5 -scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Next month"
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
          >
            <Icon name="chevron" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {cells.map((key) => {
          const inMonth = new Date(`${key}T00:00:00Z`).getUTCMonth() === month;
          const isSelected = key === selectedDate;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-label={key}
              aria-current={isSelected ? "date" : undefined}
              className={`relative mx-auto grid h-7 w-7 place-items-center rounded-full text-xs transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy ${
                isSelected
                  ? "bg-accent font-bold text-white shadow-pop"
                  : isToday
                    ? "font-bold text-accent"
                    : inMonth
                      ? "text-gray-700 hover:bg-navy-tint"
                      : "text-gray-300"
              }`}
            >
              {Number(key.slice(8))}
              {eventSet.has(key) && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      {offset !== 0 && (
        <button
          type="button"
          onClick={() => setOffset(0)}
          className="mt-2 text-[11px] font-semibold text-navy hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Back to schedule month
        </button>
      )}
    </section>
  );
}
