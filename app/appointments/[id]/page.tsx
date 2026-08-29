import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AppointmentRescheduleForm } from "@/components/appointment-reschedule-form";
import { cancelAppointment } from "@/lib/actions/appointments";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Appointment",
};

const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Addis_Ababa",
});

/** UC-10 · FR-16 — reschedule or cancel a scheduled appointment. */
export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "*, patient:patients(id, full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name), booker:profiles!appointments_scheduled_by_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();
  const appt = (data ?? null) as unknown as
    | (AppointmentRow & {
        patient: { id: string; full_name: string; patient_code: string } | null;
        hp: { full_name: string } | null;
        booker: { full_name: string } | null;
      })
    | null;
  if (!appt) notFound();

  const mayManage = await can(profile.role, "appointments.schedule");
  const isScheduled = appt.status === "scheduled";
  const terminalError = sp.notice === "err-terminal";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href={`/appointments?date=${appt.date_time.slice(0, 10)}`}
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to calendar
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">
          {DATETIME_FMT.format(new Date(appt.date_time))}
        </h1>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${
            appt.status === "scheduled"
              ? "bg-status-scheduled"
              : appt.status === "completed"
                ? "bg-status-completed"
                : appt.status === "cancelled"
                  ? "bg-status-cancelled"
                  : "bg-status-no-show"
          }`}
        >
          {appt.status === "no_show" ? "No-show" : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
        </span>
      </div>

      {terminalError && (
        <p role="alert" className="mt-5 rounded-md border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          This appointment is no longer scheduled, so it cannot be rescheduled or cancelled.
        </p>
      )}

      {/* --- SUMMARY --- */}
      <section className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Patient</dt>
            <dd className="mt-0.5 text-sm">
              {appt.patient ? (
                <Link
                  href={`/patients/${appt.patient.id}`}
                  className="font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  {appt.patient.full_name}
                  <span className="ml-2 rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold">
                    {appt.patient.patient_code}
                  </span>
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Healthcare professional
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">{appt.hp?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Booked by
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">{appt.booker?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Reason
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">{appt.reason ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {/* --- MANAGE (UC-10) --- */}
      {isScheduled ? (
        mayManage ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Reschedule
              </h2>
              <div className="mt-4">
                <AppointmentRescheduleForm
                  id={appt.id}
                  staffId={appt.staff_id}
                  currentIso={appt.date_time}
                  currentReason={appt.reason ?? ""}
                />
              </div>
            </div>

            <div className="h-fit rounded-md border border-status-cancelled/40 bg-white p-6 shadow-sm lg:w-72">
              <h2 className="text-sm font-bold uppercase tracking-wider text-status-cancelled">
                Cancel visit
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Frees the slot immediately. The patient keeps their record; the entry
                stays on the audit trail.
              </p>
              <form action={cancelAppointment} className="mt-4">
                <input type="hidden" name="id" value={appt.id} />
                <ConfirmSubmitButton
                  confirmation={`Cancel ${appt.patient?.full_name ?? "this patient"}'s appointment on ${DATETIME_FMT.format(new Date(appt.date_time))}?`}
                  className="w-full rounded-sm border border-status-cancelled bg-white px-4 py-2.5 text-sm font-bold text-status-cancelled transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  Cancel appointment…
                </ConfirmSubmitButton>
              </form>
            </div>
          </section>
        ) : (
          <p className="mt-8 rounded-md border-l-4 border-navy-light bg-navy-tint px-4 py-3 text-sm text-navy-dark">
            Rescheduling and cancellation are handled by reception. Contact the front
            desk for changes to this visit.
          </p>
        )
      ) : (
        <p className="mt-8 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-500">
          This appointment is <strong>{appt.status === "no_show" ? "marked as a no-show" : appt.status}</strong>{" "}
          and is read-only.
        </p>
      )}
    </main>
  );
}