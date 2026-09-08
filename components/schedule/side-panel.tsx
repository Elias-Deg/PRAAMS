import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { MiniCalendar } from "@/components/schedule/mini-calendar";
import {
  STATUS_BLOCK,
  STATUS_LABEL,
} from "@/components/schedule/time-grid";
import type { AppointmentStatus } from "@/types/database";

const ALL_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

function nextStatusParam(
  shown: AppointmentStatus[],
  toggle: AppointmentStatus,
): string | undefined {
  const next = shown.includes(toggle)
    ? shown.filter((s) => s !== toggle)
    : [...shown, toggle];
  // All shown → clean URL (no param means "everything").
  return next.length === ALL_STATUSES.length ? undefined : next.join(",");
}

/**
 * Schedule side panel (§14 design): mini month calendar, Team/Service filter
 * tabs — Team toggles the clinician filter, Service toggles which statuses
 * are shown (it doubles as the block-color legend).
 */
export function SidePanel({
  selectedDate,
  eventDays,
  hps,
  staffFilter,
  shownStatuses,
  tab,
  extraParams,
  urlFor,
}: {
  selectedDate: string;
  eventDays: string[];
  hps: { id: string; full_name: string }[];
  staffFilter: string;
  shownStatuses: AppointmentStatus[];
  tab: "team" | "service";
  extraParams: { staff?: string; status?: string; tab?: string };
  urlFor: (over: Record<string, string | undefined>) => string;
}): React.ReactElement {
  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-64">
      <MiniCalendar
        selectedDate={selectedDate}
        eventDays={eventDays}
        extra={extraParams}
      />

      <div
        role="group"
        aria-label="Filter mode"
        className="rounded-3xl bg-white p-1.5 shadow-soft"
      >
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href={urlFor({ tab: undefined })}
            aria-current={tab === "team" ? "true" : undefined}
            className={`rounded-xl py-2 text-center text-xs font-bold transition-all ${
              tab === "team"
                ? "bg-navy text-white shadow-pop"
                : "text-gray-500 hover:bg-navy-tint hover:text-navy"
            }`}
          >
            Team
          </Link>
          <Link
            href={urlFor({ tab: "service" })}
            aria-current={tab === "service" ? "true" : undefined}
            className={`rounded-xl py-2 text-center text-xs font-bold transition-all ${
              tab === "service"
                ? "bg-navy text-white shadow-pop"
                : "text-gray-500 hover:bg-navy-tint hover:text-navy"
            }`}
          >
            Service
          </Link>
        </div>
      </div>

      {tab === "team" ? (
        <section aria-label="Team members" className="rounded-3xl bg-white p-3 shadow-soft">
          <p className="px-1 pb-1 text-xs font-bold text-gray-900">Team members</p>
          <ul className="mt-1 list-none space-y-0.5 p-0">
            {hps.map((hp) => {
              const active = staffFilter === hp.id;
              return (
                <li key={hp.id}>
                  <Link
                    href={urlFor({ staff: active ? undefined : hp.id })}
                    aria-pressed={active}
                    className={`flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-all ${
                      active ? "bg-navy-tint shadow-soft" : "hover:bg-surface"
                    }`}
                  >
                    <Avatar name={hp.full_name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">
                      {hp.full_name}
                    </span>
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        active ? "bg-accent" : "bg-role-healthcare/40"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
            {hps.length === 0 && (
              <li className="px-2 py-3 text-xs text-gray-400">No active professionals.</li>
            )}
          </ul>
        </section>
      ) : (
        <section aria-label="Statuses shown" className="rounded-3xl bg-white p-3 shadow-soft">
          <p className="px-1 pb-1 text-xs font-bold text-gray-900">Statuses shown</p>
          <ul className="mt-1 list-none space-y-0.5 p-0">
            {ALL_STATUSES.map((s) => {
              const shown = shownStatuses.includes(s);
              return (
                <li key={s}>
                  <Link
                    href={urlFor({ status: nextStatusParam(shownStatuses, s) })}
                    aria-pressed={shown}
                    className={`flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-all ${
                      shown ? "hover:bg-surface" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-md border-2 ${
                        shown ? "border-transparent" : "border-gray-300 bg-white"
                      } ${shown ? STATUS_BLOCK[s] : ""}`}
                    >
                      {shown && <Icon name="check" className="h-3 w-3" />}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {STATUS_LABEL[s]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
