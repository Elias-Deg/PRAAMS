import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Icon } from "@/components/icons";
import { MonthGrid } from "@/components/schedule/month-grid";
import { SidePanel } from "@/components/schedule/side-panel";
import { TimeGrid, type ScheduleEvent } from "@/components/schedule/time-grid";
import { Toast } from "@/components/toast";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { ADDIS_UTC_OFFSET, todayInAddis } from "@/lib/constants";
import { addisDateKey, mondayOf } from "@/lib/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Appointment Calendar",
};

/** Post-redirect confirmations for UC-09/10 mutations (rendered as toasts). */
const NOTICES: Record<string, { text: string; tone: "success" | "error" }> = {
  scheduled: { text: "Appointment booked.", tone: "success" },
  rescheduled: { text: "Appointment rescheduled.", tone: "success" },
  cancelled: { text: "Appointment cancelled. The slot is free again.", tone: "success" },
  error: { text: "Something went wrong. Please try again.", tone: "error" },
  "err-not-found": { text: "That appointment no longer exists.", tone: "error" },
  "err-terminal": { text: "That appointment is no longer scheduled.", tone: "error" },
};

const ALL_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
];

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function shiftDate(dateISO: string, days: number): string {
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function monthShift(dateISO: string, delta: number): string {
  const d = new Date(`${dateISO.slice(0, 7)}-01T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1))
    .toISOString()
    .slice(0, 10);
}

function monthEnd(dateISO: string): string {
  const d = new Date(`${dateISO.slice(0, 7)}-01T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
}

function parseStatuses(raw: unknown): AppointmentStatus[] {
  if (typeof raw !== "string" || raw.length === 0) return [...ALL_STATUSES];
  const set = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is AppointmentStatus => (ALL_STATUSES as string[]).includes(s));
  return [...new Set(set)];
}

const SELECT =
  "id, date_time, status, reason, patient_id, patient:patients(id, full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name)";

/**
 * UC-11 · FR-17 — Schedule (§14 reference design): side panel with mini
 * calendar + Team/Service filters, and Daily/Weekly/Monthly views over a
 * continuous EAT time grid with pastel status blocks and a live now-line.
 */
export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/appointments">): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") redirect("/login");

  const params = await searchParams;
  const rawDate = typeof params.date === "string" ? params.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayInAddis();
  const view = params.view === "day" || params.view === "month" ? params.view : "week";
  const staffFilter =
    typeof params.staff === "string" && /^[0-9a-f-]{36}$/i.test(params.staff)
      ? params.staff
      : "";
  const tab = params.tab === "service" ? "service" : "team";
  const shownStatuses = parseStatuses(params.status);
  const notice =
    typeof params.notice === "string" ? NOTICES[params.notice] : undefined;
  const today = todayInAddis();

  const maySchedule = await can(profile.role, "appointments.schedule");

  const supabase = await createSupabaseServerClient();
  const { data: hpsData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "healthcare_professional")
    .eq("status", "active")
    .order("full_name");
  const hps = (hpsData ?? []) as { id: string; full_name: string }[];
  const weekStart = mondayOf(date);
  const monthFirst = `${date.slice(0, 7)}-01`;
  const rangeStart =
    view === "month" ? monthFirst : view === "week" ? weekStart : date;
  const rangeEnd =
    view === "month" ? monthEnd(date) : view === "week" ? shiftDate(weekStart, 6) : date;

  // Range rows (grid + chips) and month rows (mini-cal dots + month view).
  const load = async (start: string, end: string): Promise<ScheduleEvent[]> => {
    let q = supabase
      .from("appointments")
      .select(SELECT)
      .gte("date_time", `${start}T00:00:00${ADDIS_UTC_OFFSET}`)
      .lte("date_time", `${end}T23:59:59${ADDIS_UTC_OFFSET}`)
      .order("date_time", { ascending: true });
    if (staffFilter) q = q.eq("staff_id", staffFilter);
    if (shownStatuses.length === 0) q = q.eq("id", ZERO_UUID);
    else if (shownStatuses.length < ALL_STATUSES.length)
      q = q.in("status", shownStatuses);
    const { data } = await q;
    return (data ?? []) as unknown as ScheduleEvent[];
  };
  const [events, monthEvents] = await Promise.all([
    load(rangeStart, rangeEnd),
    load(monthFirst, monthEnd(date)),
  ]);

  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i))
      : [date];
  const eventDays = [...new Set(monthEvents.map((e) => addisDateKey(e.date_time)))];

  const nowLabel = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
  const [nh, nm] = nowLabel.split(":").map(Number);
  const nowMinutes = nh * 60 + nm;
  const now =
    days.includes(today) && nowMinutes >= 9 * 60 && nowMinutes <= 17 * 60
      ? { minutes: nowMinutes, label: nowLabel }
      : null;

  const step = view === "week" ? 7 : view === "day" ? 1 : 0;
  const prevDate = view === "month" ? monthShift(date, -1) : shiftDate(date, -step);
  const nextDate = view === "month" ? monthShift(date, 1) : shiftDate(date, step);

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(
      new Date(`${iso}T12:00:00Z`),
    );
  const rangeLabel =
    view === "month"
      ? fmt(date, { month: "long", year: "numeric" })
      : view === "day"
        ? fmt(date, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : `${fmt(weekStart, { day: "numeric", month: "short" })} – ${fmt(
            shiftDate(weekStart, 6),
            { day: "numeric", month: "short", year: "numeric" },
          )}`;

  return (
    <ScheduleScreen
      notice={notice}
      view={view}
      date={date}
      today={today}
      days={days}
      events={events}
      monthFirst={monthFirst}
      monthEvents={monthEvents}
      eventDays={eventDays}
      hps={hps}
      staffFilter={staffFilter}
      shownStatuses={shownStatuses}
      tab={tab}
      maySchedule={maySchedule}
      now={now}
      rangeLabel={rangeLabel}
      prevDate={prevDate}
      nextDate={nextDate}
    />
  );
}
interface ScreenProps {
  notice: { text: string; tone: "success" | "error" } | undefined;
  view: "day" | "week" | "month";
  date: string;
  today: string;
  days: string[];
  events: ScheduleEvent[];
  monthFirst: string;
  monthEvents: ScheduleEvent[];
  eventDays: string[];
  hps: { id: string; full_name: string }[];
  staffFilter: string;
  shownStatuses: AppointmentStatus[];
  tab: "team" | "service";
  maySchedule: boolean;
  now: { minutes: number; label: string } | null;
  rangeLabel: string;
  prevDate: string;
  nextDate: string;
}

function ScheduleScreen(p: ScreenProps): React.ReactElement {
  const urlFor = (over: Record<string, string | undefined>): string => {
    const merged: Record<string, string | undefined> = {
      view: p.view,
      date: p.date,
      staff: p.staffFilter || undefined,
      status: p.shownStatuses.length < 4 ? p.shownStatuses.join(",") : undefined,
      tab: p.tab === "service" ? "service" : undefined,
      ...over,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/appointments?${qs}` : "/appointments";
  };

  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row">
      {p.notice && <Toast message={p.notice.text} tone={p.notice.tone} />}
      <SidePanel
        selectedDate={p.date}
        eventDays={p.eventDays}
        hps={p.hps}
        staffFilter={p.staffFilter}
        shownStatuses={p.shownStatuses}
        tab={p.tab}
        extraParams={{
          staff: p.staffFilter || undefined,
          status: p.shownStatuses.length < 4 ? p.shownStatuses.join(",") : undefined,
          tab: p.tab === "service" ? "service" : undefined,
        }}
        urlFor={urlFor}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">Schedule</h1>
          {p.maySchedule && (
            <Link
              href="/appointments/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-display text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-[0.98]"
            >
              <Icon name="plus" className="h-4 w-4" />
              New appointment
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white px-3 py-2.5 shadow-soft">
          <div className="flex items-center gap-1.5">
            <Link
              href={urlFor({ date: p.today })}
              className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:border-accent hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
            >
              Today
            </Link>
            <Link
              href={urlFor({ date: p.prevDate })}
              aria-label={`Previous ${p.view}`}
              className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
            >
              <Icon name="chevron" className="h-4 w-4 -scale-x-100" />
            </Link>
            <Link
              href={urlFor({ date: p.nextDate })}
              aria-label={`Next ${p.view}`}
              className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
            >
              <Icon name="chevron" className="h-4 w-4" />
            </Link>
            <p className="ml-1 font-display text-base font-bold text-gray-900">
              {p.rangeLabel}
            </p>
          </div>
          <div
            role="group"
            aria-label="Calendar view"
            className="inline-flex rounded-xl bg-gray-100 p-1"
          >
            {(["day", "week", "month"] as const).map((v) => (
              <Link
                key={v}
                href={urlFor({ view: v })}
                aria-current={p.view === v ? "true" : undefined}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  p.view === v
                    ? "bg-white text-navy shadow-pop"
                    : "text-gray-500 hover:text-navy"
                }`}
              >
                {v === "day" ? "Daily" : v === "week" ? "Weekly" : "Monthly"}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {p.view === "month" ? (
            <MonthGrid anchor={p.monthFirst} events={p.monthEvents} today={p.today} />
          ) : (
            <>
              <TimeGrid
                days={p.days}
                events={p.events}
                today={p.today}
                nowMinutes={p.now ? p.now.minutes : null}
                nowLabel={p.now ? p.now.label : ""}
              />
              {p.events.length === 0 && (
                <div className="mt-4 rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-soft">
                  <p className="text-sm font-semibold text-gray-800">
                    No appointments {p.view === "week" ? "this week" : "on this day"}
                    {p.staffFilter ? " for this professional" : ""}.
                  </p>
                  {p.maySchedule && (
                    <Link
                      href="/appointments/new"
                      className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    >
                      Book an appointment
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
