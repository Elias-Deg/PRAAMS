import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";import { Toast } from "@/components/toast";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { ADDIS_UTC_OFFSET, todayInAddis } from "@/lib/constants";
import { addisDateKey, addisTimeLabel, mondayOf, slotLabels } from "@/lib/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Appointment Calendar",
};

const STATUS_PILL: Record<AppointmentStatus, string> = {
  scheduled: "bg-status-scheduled",
  completed: "bg-status-completed",
  cancelled: "bg-status-cancelled",
  no_show: "bg-status-no-show",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

/** Week-grid block colors by status (cancelled = muted + strikethrown). */
const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  scheduled: "bg-status-scheduled",
  completed: "bg-status-completed",
  no_show: "bg-status-no-show",
  cancelled: "bg-gray-200",
};

interface CalendarRow {
  id: string;
  date_time: string;
  status: AppointmentStatus;
  reason: string | null;
  patient_id: string;
  patient: { id: string; full_name: string; patient_code: string } | null;
  hp: { full_name: string } | null;
}

/** Post-redirect confirmations for UC-09/10 mutations (rendered as toasts). */
const NOTICES: Record<string, { text: string; tone: "success" | "error" }> = {
  scheduled: { text: "Appointment booked.", tone: "success" },
  rescheduled: { text: "Appointment rescheduled.", tone: "success" },
  cancelled: { text: "Appointment cancelled. The slot is free again.", tone: "success" },
  error: { text: "Something went wrong. Please try again.", tone: "error" },
  "err-not-found": { text: "That appointment no longer exists.", tone: "error" },
  "err-terminal": { text: "That appointment is no longer scheduled.", tone: "error" },
};

function shiftDate(dateISO: string, days: number): string {
  const ms = Date.parse(`${dateISO}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** UC-11 · FR-17 — day calendar for receptionists and healthcare professionals. */
export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/appointments">): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") redirect("/login");

  const params = await searchParams;
  const rawDate = typeof params.date === "string" ? params.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayInAddis();
  const staffFilter = typeof params.staff === "string" ? params.staff : "";
  const view = params.view === "day" ? "day" : "week"; // week = primary (§3)
  const today = todayInAddis();
  const notice =
    typeof params.notice === "string" ? NOTICES[params.notice] : undefined;

  const maySchedule = await can(profile.role, "appointments.schedule");
  const mayManage = maySchedule; // UC-10 actions are receptionist/administrator

  const supabase = await createSupabaseServerClient();

  const { data: hps } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "healthcare_professional")
    .eq("status", "active")
    .order("full_name");
  const hpList = (hps ?? []) as { id: string; full_name: string }[];

  const weekStart = mondayOf(date);
  const weekEnd = shiftDate(weekStart, 6);
  const step = view === "week" ? 7 : 1;

  const rangeStart = view === "week" ? weekStart : date;
  const rangeEnd = view === "week" ? weekEnd : date;

  let query = supabase
    .from("appointments")
    .select(
      "id, date_time, status, reason, patient_id, patient:patients(id, full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name)",
    )
    .gte("date_time", `${rangeStart}T00:00:00${ADDIS_UTC_OFFSET}`)
    .lte("date_time", `${rangeEnd}T23:59:59${ADDIS_UTC_OFFSET}`)
    .order("date_time", { ascending: true });
  if (/^[0-9a-f-]{36}$/i.test(staffFilter)) {
    query = query.eq("staff_id", staffFilter);
  }
  const { data: rows } = await query;
  const appointments = (rows ?? []) as unknown as CalendarRow[];

  // Week-grid structures: (addisDate + slotLabel) → blocks in that cell.
  const slots = slotLabels();
  const slotSet = new Set(slots);
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));
  const cells = new Map<string, CalendarRow[]>();
  const offGrid: CalendarRow[] = [];
  if (view === "week") {
    for (const row of appointments) {
      const dayKey = addisDateKey(row.date_time);
      const timeLabel = addisTimeLabel(row.date_time);
      if (slotSet.has(timeLabel) && days.includes(dayKey)) {
        const key = `${dayKey} ${timeLabel}`;
        const list = cells.get(key) ?? [];
        list.push(row);
        cells.set(key, list);
      } else {
        offGrid.push(row);
      }
    }
  }

  const counts = appointments.reduce<Record<AppointmentStatus, number>>(
    (acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }),
    { scheduled: 0, completed: 0, cancelled: 0, no_show: 0 },
  );

  const dayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="mx-auto w-full max-w-5xl">
      {notice && <Toast message={notice.text} tone={notice.tone} />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">Schedule · UC-11</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full border border-gray-300 bg-white p-1" role="group" aria-label="Calendar view">
            <Link
              href={`/appointments?view=week&date=${date}${staffFilter ? `&staff=${staffFilter}` : ""}`}
              aria-current={view === "week" ? "true" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                view === "week" ? "bg-navy text-white" : "text-gray-600 hover:text-navy"
              }`}
            >
              Week
            </Link>
            <Link
              href={`/appointments?view=day&date=${date}${staffFilter ? `&staff=${staffFilter}` : ""}`}
              aria-current={view === "day" ? "true" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                view === "day" ? "bg-navy text-white" : "text-gray-600 hover:text-navy"
              }`}
            >
              Day
            </Link>
          </div>
          {maySchedule && (
            <Link
              href="/appointments/new"
              className="rounded-full bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              + New booking
            </Link>
          )}
        </div>
      </div>

      {/* --- DAY/WEEK NAV / FILTER --- */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/appointments?view=${view}&date=${shiftDate(date, -step)}${staffFilter ? `&staff=${staffFilter}` : ""}`}
          aria-label={view === "week" ? "Previous week" : "Previous day"}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          ←
        </Link>
        <form action="/appointments" method="get" className="flex items-center gap-2">
          <input type="hidden" name="view" value={view} />
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
          />
          <select
            name="staff"
            defaultValue={staffFilter}
            aria-label="Filter by healthcare professional"
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
          >
            <option value="">All professionals</option>
            {hpList.map((hp) => (
              <option key={hp.id} value={hp.id}>
                {hp.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl border border-navy bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            View
          </button>
        </form>
        <Link
          href={`/appointments?view=${view}&date=${shiftDate(date, step)}${staffFilter ? `&staff=${staffFilter}` : ""}`}
          aria-label={view === "week" ? "Next week" : "Next day"}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          →
        </Link>
        <p className="ml-auto text-sm font-semibold text-gray-700">{dayLabel}</p>
      </div>

      {/* --- SUMMARY CHIPS --- */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((status) => (
          <span
            key={status}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${STATUS_PILL[status]}`}
          >
            {STATUS_LABEL[status]}
            <span className="rounded-full bg-white/25 px-1.5">{counts[status]}</span>
          </span>
        ))}
      </div>

      {/* --- VIEW: WEEK GRID (primary) --- */}
      {view === "week" && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`inline-block h-3 w-3 rounded-xl ${STATUS_BLOCK[status]}`} />
                {STATUS_LABEL[status]}
              </span>
            ))}
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-soft">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[56px_repeat(7,minmax(104px,1fr))] border-b border-gray-100 bg-navy-tint">
                <div className="px-2 py-2 text-[10px] font-bold uppercase text-navy">Time</div>
                {days.map((d) => {
                  const isToday = d === today;
                  const closed = new Date(`${d}T00:00:00Z`).getUTCDay() === 0;
                  return (
                    <div
                      key={d}
                      className={`px-1 py-2 text-center text-xs font-semibold first:rounded-tl-2xl last:rounded-tr-2xl ${isToday ? "bg-navy text-white" : "text-navy"}`}
                    >
                      {new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(
                        new Date(`${d}T12:00:00Z`),
                      )}{" "}
                      {Number(d.slice(8))}
                      {isToday && (
                        <span className="ml-1 rounded-full bg-white/25 px-1.5 text-[9px] font-bold">Today</span>
                      )}
                      {closed && <span className="block text-[9px] font-normal opacity-70">Closed</span>}
                    </div>
                  );
                })}
              </div>

              {slots.map((slot) => (
                <div
                  key={slot}
                  className="grid grid-cols-[56px_repeat(7,minmax(104px,1fr))] border-b border-gray-100 last:border-b-0"
                >
                  <div className="border-r border-gray-100 px-1 py-2 text-right text-[10px] font-medium text-gray-400">
                    {slot}
                  </div>
                  {days.map((d) => {
                    const isSunday = new Date(`${d}T00:00:00Z`).getUTCDay() === 0;
                    const cellRows = cells.get(`${d} ${slot}`) ?? [];
                    return (
                      <div
                        key={`${d}-${slot}`}
                        className={`min-h-[52px] border-r border-gray-100 p-1 last:border-r-0 ${
                          isSunday ? "bg-gray-50" : d === today ? "bg-navy-tint/40" : ""
                        }`}
                      >
                        {cellRows.map((row) => {
                          const cancelled = row.status === "cancelled";
                          const tooltip = `${addisTimeLabel(row.date_time)} · ${
                            row.patient?.full_name ?? "Unknown"
                          } (${row.patient?.patient_code ?? "—"}) with ${
                            row.hp?.full_name ?? "—"
                          }${row.reason ? ` — ${row.reason}` : ""} · ${STATUS_LABEL[row.status]}`;
                          return (
                            <Link
                              key={row.id}
                              href={`/appointments/${row.id}`}
                              title={tooltip}
                              className={`mb-1 block truncate rounded-xl px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-110 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy active:scale-[0.98] ${
                                STATUS_BLOCK[row.status]
                              } ${cancelled ? "text-gray-500 line-through" : "text-white"}`}
                            >
                              <span className="font-semibold">
                                {row.patient?.full_name.split(" ")[0] ?? "?"}
                              </span>{" "}
                              <span className="opacity-80">{addisTimeLabel(row.date_time)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {offGrid.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {offGrid.length} appointment{offGrid.length === 1 ? "" : "s"} fall
              {offGrid.length === 1 ? "s" : ""} outside clinic hours — switch to the Day
              view for details.
            </p>
          )}
          {appointments.length === 0 && (
            <p className="mt-3 text-sm font-medium text-gray-600">
              No appointments this week —{" "}
              {maySchedule ? "book one from the button above." : "check another week."}
            </p>
          )}
        </>
      )}

      {/* --- VIEW: DAY LIST (alternate) --- */}
      {view === "day" && (
        <>
      {/* --- DAY LIST / EMPTY STATE --- */}
      {appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-soft">
          <p className="text-base font-semibold text-gray-800">
            No appointments on {dayLabel}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {maySchedule
              ? "Book the first visit for the day."
              : "Check another day or clear the professional filter."}
          </p>
          {maySchedule && (
            <Link
              href="/appointments/new"
              className="mt-5 inline-flex rounded-full bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Book an appointment
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 list-none space-y-3 p-0">
          {appointments.map((appt) => {
            const manageable = mayManage && appt.status === "scheduled";
            return (
              <li
                key={appt.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-soft"
              >
                <span className="w-16 text-lg font-bold text-navy">{addisTimeLabel(appt.date_time)}</span>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${STATUS_PILL[appt.status]}`}
                >
                  {STATUS_LABEL[appt.status]}
                </span>
                <span className="min-w-[200px] text-sm">
                  {appt.patient ? (
                    <Link
                      href={`/patients/${appt.patient.id}`}
                      className="font-medium text-gray-900 underline-offset-2 hover:text-navy hover:underline focus-visible:text-navy focus-visible:underline focus-visible:outline-none"
                    >
                      {appt.patient.full_name}
                      <span className="ml-2 rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
                        {appt.patient.patient_code}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-gray-400">Unknown patient</span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  {appt.hp?.full_name ?? "—"}
                </span>
                <span className="flex-1 truncate text-sm text-gray-500">
                  {appt.reason ?? "—"}
                </span>
                {manageable && (
                  <Link
                    href={`/appointments/${appt.id}`}
                    className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    Manage
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      </>
      )}
    </div>
  );
}



