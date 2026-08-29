import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { ADDIS_UTC_OFFSET, todayInAddis } from "@/lib/constants";
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

interface CalendarRow {
  id: string;
  date_time: string;
  status: AppointmentStatus;
  reason: string | null;
  patient_id: string;
  patient: { id: string; full_name: string; patient_code: string } | null;
  hp: { full_name: string } | null;
}

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

  let query = supabase
    .from("appointments")
    .select(
      "id, date_time, status, reason, patient_id, patient:patients(id, full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name)",
    )
    .gte("date_time", `${date}T00:00:00${ADDIS_UTC_OFFSET}`)
    .lte("date_time", `${date}T23:59:59${ADDIS_UTC_OFFSET}`)
    .order("date_time", { ascending: true });
  if (/^[0-9a-f-]{36}$/i.test(staffFilter)) {
    query = query.eq("staff_id", staffFilter);
  }
  const { data: rows } = await query;
  const appointments = (rows ?? []) as unknown as CalendarRow[];

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">Day calendar · UC-11</p>
        </div>
        {maySchedule && (
          <Link
            href="/appointments/new"
            className="rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            + New booking
          </Link>
        )}
      </div>

      {/* --- DAY NAV / FILTER --- */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/appointments?date=${shiftDate(date, -1)}${staffFilter ? `&staff=${staffFilter}` : ""}`}
          className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          ←
        </Link>
        <form action="/appointments" method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
          />
          <select
            name="staff"
            defaultValue={staffFilter}
            aria-label="Filter by healthcare professional"
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
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
            className="rounded-sm border border-navy bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            View day
          </button>
        </form>
        <Link
          href={`/appointments?date=${shiftDate(date, 1)}${staffFilter ? `&staff=${staffFilter}` : ""}`}
          className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
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

      {/* --- DAY LIST / EMPTY STATE --- */}
      {appointments.length === 0 ? (
        <div className="mt-6 rounded-md border border-gray-200 bg-white p-10 text-center shadow-sm">
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
              className="mt-5 inline-flex rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Book an appointment
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 list-none space-y-3 p-0">
          {appointments.map((appt) => {
            const timeLabel = appt.date_time.slice(11, 16);
            const manageable = mayManage && appt.status === "scheduled";
            return (
              <li
                key={appt.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <span className="w-16 text-lg font-bold text-navy">{timeLabel}</span>
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
    </main>
  );
}