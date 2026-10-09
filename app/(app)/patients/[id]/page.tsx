import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { Toast } from "@/components/toast";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Patient Record",
};

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });
const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function ageFrom(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

interface HistoryEntry {
  id: string;
  visit_date: string;
  diagnosis: string;
  notes: string | null;
  author: { full_name: string } | null;
}

/**
 * UC-05 view + UC-08 history (§14 design language): gradient patient hero,
 * bubbly detail tiles, and a staggered clinical timeline.
 */
export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();

  const { data: patientData } = await supabase
    .from("patients")
    .select("*, registrar:profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  const patient = (patientData ?? null) as unknown as
    | (PatientRow & { registrar: { full_name: string } | null })
    | null;
  if (!patient) notFound();

  const [canEdit, canAddRecord, maySchedule] = profile
    ? [
        await can(profile.role, "patients.edit"),
        await can(profile.role, "records.add"),
        await can(profile.role, "appointments.schedule"),
      ]
    : [false, false, false];

  // FR-07 flag surfaced post-registration (?dup=<ids> from createPatient).
  const dupIds =
    typeof sp.dup === "string" && sp.dup.length > 0
      ? sp.dup.split(",").filter((v) => v !== id)
      : [];
  const { data: dupRows } =
    dupIds.length > 0
      ? await supabase
          .from("patients")
          .select("id, full_name, patient_code")
          .in("id", dupIds)
      : { data: [] as { id: string; full_name: string; patient_code: string }[] };
  const duplicates = (dupRows ?? []) as { id: string; full_name: string; patient_code: string }[];

  // UC-08 · FR-11 — full medical history, newest first, with author attribution.
  const { data: historyRows } = await supabase
    .from("medical_records")
    .select("id, visit_date, diagnosis, notes, author:profiles(full_name)")
    .eq("patient_id", id)
    .order("visit_date", { ascending: false });
  const history = (historyRows ?? []) as unknown as HistoryEntry[];

  const notice = typeof sp.notice === "string" ? sp.notice : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="animate-pop-in">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-navy transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <Icon name="chevron" className="h-3.5 w-3.5 -scale-x-100" />
          Back to patients
        </Link>
      </div>

      {/* --- PATIENT HERO (§4 summary, §14 language) --- */}
      <section className="relative isolate mt-4 animate-pop-in overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-light p-6 text-white shadow-pop sm:p-8 [animation-delay:80ms]">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-5 -top-7 -z-10 h-24 w-24 animate-float rounded-full bg-white/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -z-10 bottom-3 right-24 h-12 w-12 animate-float rounded-full bg-white/10 [animation-delay:900ms]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-5 -z-10 bottom-8 h-16 w-16 animate-float rounded-full bg-white/15 [animation-delay:1.6s]"
        />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden
              className="group grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white shadow-pop sm:h-20 sm:w-20"
            >
              <Avatar name={patient.full_name} size="lg" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{patient.full_name}</h1>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                  {patient.patient_code}
                </span>
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span>
                  {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} ·{" "}
                  {ageFrom(patient.date_of_birth)} years · DOB{" "}
                  {DATE_FMT.format(new Date(patient.date_of_birth))}
                </span>
                {patient.phone && (
                  <span className="font-semibold text-white">{patient.phone}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {maySchedule && (
              <Link
                href={`/appointments/new?patient=${patient.id}`}
                className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
              >
                Book appointment
              </Link>
            )}
            {canEdit && (
              <Link
                href={`/patients/${patient.id}/edit`}
                className="rounded-full bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
              >
                Edit details
              </Link>
            )}
            {canAddRecord && (
              <Link
                href={`/patients/${patient.id}/records/new`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-accent shadow-pop transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add clinical entry
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* --- DETAILS (bubbly tiles) --- */}
      <section
        aria-label="Patient details"
        className="mt-5 animate-pop-in rounded-3xl bg-white p-5 shadow-soft [animation-delay:160ms]"
      >
        <h2 className="font-display text-base font-bold text-gray-900">Patient details</h2>
        <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {(
            [
              ["Address", patient.address ?? "—"],
              ["Emergency contact", patient.emergency_contact ?? "—"],
              [
                "Registered",
                `${DATETIME_FMT.format(new Date(patient.created_at))}${
                  patient.registrar?.full_name ? ` by ${patient.registrar.full_name}` : ""
                }`,
              ],
              ["Patient code", patient.patient_code],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* --- NOTICES (toasts, §5) --- */}
      {notice === "created" && (
        <Toast message="Patient registered. A patient code has been assigned automatically." />
      )}
      {notice === "record-added" && (
        <Toast message="Clinical entry added to the permanent record." />
      )}
      {duplicates.length > 0 && (
        <div
          role="status"
          className="mt-5 animate-pop-in rounded-2xl border-l-4 border-status-no-show bg-[#f5ebd8]/60 px-4 py-3 text-sm text-gray-800 shadow-soft"
        >
          <p className="font-semibold">Possible duplicate patient{duplicates.length > 1 ? "s" : ""} (FR-07):</p>
          <ul className="mt-2 list-inside list-disc">
            {duplicates.map((dup) => (
              <li key={dup.id}>
                <Link
                  href={`/patients/${dup.id}`}
                  className="font-medium text-navy underline underline-offset-2"
                >
                  {dup.full_name} ({dup.patient_code})
                </Link>{" "}
                shares the same name with a matching phone or date of birth.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            This registration was still saved — review both records and contact the desk
            if a merge is needed.
          </p>
        </div>
      )}

      {/* --- MEDICAL HISTORY (UC-08 / FR-11) --- */}
      <section
        aria-label="Medical history"
        className="mt-5 animate-pop-in rounded-3xl bg-white p-5 shadow-soft [animation-delay:240ms]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-gray-900">Medical history</h2>
          <span className="rounded-full bg-navy-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
            {history.length} entr{history.length === 1 ? "y" : "ies"} · permanent (FR-12)
          </span>
        </div>

        {history.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-surface p-8 text-center">
            <p className="text-sm font-semibold text-gray-800">No clinical entries yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Entries are added by healthcare professionals during visits.
            </p>
            {canAddRecord && (
              <Link
                href={`/patients/${patient.id}/records/new`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add the first entry
              </Link>
            )}
          </div>
        ) : (
          <ol className="relative ml-3 mt-4 list-none space-y-3 border-l-2 border-accent/20 p-0">
            {history.map((entry, index) => (
              <li
                key={entry.id}
                className="relative animate-pop-in pl-6"
                style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
              >
                <span
                  aria-hidden
                  className={`absolute -left-[9px] top-5 h-4 w-4 rounded-full border-2 border-white ${
                    index === 0 ? "bg-accent" : "bg-accent-light"
                  }`}
                />
                <div className="rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-navy-tint/60">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-gray-900">{entry.diagnosis}</p>
                    <time
                      dateTime={entry.visit_date}
                      className="text-xs font-medium text-gray-500"
                    >
                      {DATETIME_FMT.format(new Date(entry.visit_date))}
                    </time>
                  </div>
                  {entry.notes && (
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                      {entry.notes}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Authored by {entry.author?.full_name ?? "unknown staff"} — permanent entry
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
