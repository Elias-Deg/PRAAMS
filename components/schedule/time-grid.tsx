import Link from "next/link";

import { addisDateKey, addisTimeLabel } from "@/lib/time";
import type { AppointmentStatus } from "@/types/database";

/** Pastel block palette by status (§14 schedule design) — muted, bubbly. */
export const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  scheduled: "bg-[#e3ebfa] text-[#2e4e85] hover:bg-[#d4e0f6]",
  completed: "bg-[#dcf0e7] text-[#2c6e52] hover:bg-[#cbe8db]",
  no_show: "bg-[#f5ebd8] text-[#7d6335] hover:bg-[#eee1c6]",
  cancelled: "bg-gray-100 text-gray-500 line-through hover:bg-gray-200/70",
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export interface ScheduleEvent {
  id: string;
  date_time: string;
  status: AppointmentStatus;
  reason: string | null;
  patient: { id: string; full_name: string; patient_code: string } | null;
  hp: { full_name: string } | null;
}

const HOUR_PX = 96;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function initials(name: string): string {
  return firstName(name).charAt(0).toUpperCase() || "?";
}

function startMinutes(event: ScheduleEvent): number {
  const [h, m] = addisTimeLabel(event.date_time).split(":").map(Number);
  return h * 60 + m;
}

function endLabel(iso: string): string {
  return addisTimeLabel(new Date(Date.parse(iso) + 30 * 60_000).toISOString());
}

/**
 * Continuous time grid (§14 schedule design): hour rows, events absolutely
 * positioned by their Addis time as pastel status blocks, today column
 * highlighted, Sundays marked Closed, red now-line with a time badge.
 */
export function TimeGrid({
  days,
  events,
  startHour = 9,
  endHour = 17,
  today,
  nowMinutes,
  nowLabel,
}: {
  days: string[];
  events: ScheduleEvent[];
  startHour?: number;
  endHour?: number;
  today: string;
  nowMinutes: number | null;
  nowLabel: string;
}): React.ReactElement {
  const hourCount = endHour - startHour;
  const totalH = hourCount * HOUR_PX;

  const perDay = days.map((d) => {
    const rows = events
      .filter((e) => addisDateKey(e.date_time) === d)
      .sort((a, b) => Date.parse(a.date_time) - Date.parse(b.date_time));
    const groups: ScheduleEvent[][] = [];
    for (const row of rows) {
      const last = groups[groups.length - 1];
      if (last && startMinutes(row) === startMinutes(last[0])) last.push(row);
      else groups.push([row]);
    }
    return groups;
  });

  const nowTop =
    nowMinutes !== null
      ? Math.max(0, ((nowMinutes - startHour * 60) / 60) * HOUR_PX)
      : null;

  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
      <div className="min-w-[840px]">
        <div className="flex border-b border-gray-100">
          <div className="w-16 shrink-0 self-center px-1 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-400">
            EAT
            <br />
            +03:00
          </div>
          {days.map((d) => (
            <DayHeader key={d} date={d} isToday={d === today} />
          ))}
        </div>
        <div className="flex" style={{ height: totalH }}>
          <div className="relative w-16 shrink-0">
            {Array.from({ length: hourCount }, (_, i) => (
              <span
                key={i}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-semibold text-gray-400"
                style={{ top: i * HOUR_PX }}
              >
                {String(startHour + i).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          <div className="relative flex flex-1">
            {Array.from({ length: hourCount }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-gray-100"
                style={{ top: i * HOUR_PX }}
              />
            ))}

            {days.map((d, di) => {
              const isSunday = new Date(`${d}T00:00:00Z`).getUTCDay() === 0;
              const isToday = d === today;
              return (
                <div
                  key={d}
                  className={`relative flex-1 border-l border-gray-100 ${
                    isSunday ? "bg-gray-50/70" : isToday ? "bg-accent/5" : ""
                  }`}
                >
                  {(perDay[di] ?? []).map((group) =>
                    group.map((row, gi) => {
                      const groupLen = group.length;
                      const top = Math.max(
                        0,
                        ((startMinutes(row) - startHour * 60) / 60) * HOUR_PX + 2,
                      );
                      const patient = row.patient?.full_name ?? "Unknown patient";
                      const hpName = row.hp?.full_name ?? "—";
                      const tooltip = `${addisTimeLabel(row.date_time)} · ${patient} (${
                        row.patient?.patient_code ?? "—"
                      }) with ${hpName}${row.reason ? ` — ${row.reason}` : ""} · ${
                        STATUS_LABEL[row.status]
                      }`;
                      return (
                        <Link
                          key={row.id}
                          href={`/appointments/${row.id}`}
                          title={tooltip}
                          className={`absolute overflow-hidden rounded-xl px-2 py-1 shadow-sm transition-all hover:z-10 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy active:scale-[0.98] ${
                            STATUS_BLOCK[row.status]
                          }`}
                          style={{
                            top: `${top}px`,
                            height: 46,
                            left: `calc(${(gi / groupLen) * 100}% + 3px)`,
                            width: `calc(${(1 / groupLen) * 100}% - 6px)`,
                          }}
                        >
                          <p className="truncate text-[11px] font-bold leading-tight">
                            {patient}
                          </p>
                          <p className="truncate text-[10px] leading-tight opacity-80">
                            {addisTimeLabel(row.date_time)} – {endLabel(row.date_time)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold leading-none opacity-90">
                            <span
                              aria-hidden
                              className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-white/80 text-[7px] font-bold text-gray-700"
                            >
                              {initials(hpName)}
                            </span>
                            <span className="truncate">{firstName(hpName)}</span>
                          </p>
                        </Link>
                      );
                    }),
                  )}
                </div>
              );
            })}

            {nowTop !== null && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-10"
                style={{ top: `${nowTop}px` }}
              >
                <div className="border-t-2 border-red-500/80" />
                <span className="absolute -right-1 top-1.5 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-pop">
                  {nowLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayHeader({ date, isToday }: { date: string; isToday: boolean }): React.ReactElement {
  const isSunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
  return (
    <div
      className={`flex-1 border-l border-gray-100 px-2 py-3 text-center ${
        isSunday ? "bg-gray-50/70" : isToday ? "bg-accent/5" : ""
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-wider ${
          isToday ? "text-accent" : "text-gray-400"
        }`}
      >
        {new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" })
          .format(new Date(`${date}T00:00:00Z`))
          .toUpperCase()}
      </p>
      <p
        className={`font-display text-lg font-bold leading-tight ${
          isToday ? "text-accent" : "text-gray-900"
        }`}
      >
        {Number(date.slice(8))}
      </p>
      {isToday && (
        <p className="text-[9px] font-bold uppercase tracking-wide text-accent/70">Today</p>
      )}
      {isSunday && <p className="text-[9px] text-gray-400">Closed</p>}
    </div>
  );
}
