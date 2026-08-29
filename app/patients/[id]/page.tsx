import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MedicalRecordRow, PatientRow } from "@/types/database";

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

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
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

  const [canEdit, canAddRecord] = profile
    ? [await can(profile.role, "patients.edit"), await can(profile.role, "records.add")]
    : [false, false];

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

  const notice =
    typeof sp.notice === "string" ? sp.notice : undefined;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link
        href="/patients"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to patients
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{patient.full_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-navy-tint px-2.5 py-0.5 text-xs font-bold text-navy">
              {patient.patient_code}
            </span>
            <span>
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} ·{" "}
              {ageFrom(patient.date_of_birth)} years · DOB{" "}
              {DATE_FMT.format(new Date(patient.date_of_birth))}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <Link
              href={`/patients/${patient.id}/edit`}
              className="rounded-sm border border-navy bg-white px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Edit details
            </Link>
          )}
          {canAddRecord && (
            <Link
              href={`/patients/${patient.id}/records/new`}
              className="rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              + Add clinical entry
            </Link>
          )}
        </div>
      </div>

      {/* --- NOTICES --- */}
      {notice === "created" && (
        <p role="status" className="mt-6 rounded-md border-l-4 border-status-completed bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          Patient registered. A patient code has been assigned automatically.
        </p>
      )}
      {notice === "record-added" && (
        <p role="status" className="mt-6 rounded-md border-l-4 border-status-completed bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          Clinical entry added to the permanent record.
        </p>
      )}
      {duplicates.length > 0 && (
        <div
          role="status"
          className="mt-6 rounded-md border-l-4 border-status-no-show bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
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
                </Link>
                {" "}shares the same name with a matching phone or date of birth.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            This registration was still saved — review both records and contact the desk
            if a merge is needed.
          </p>
        </div>
      )}

      {/* --- DEMOGRAPHICS --- */}
      <section className="mt-8 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Demographic information
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{patient.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Address</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{patient.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Emergency contact
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">{patient.emergency_contact ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Registered
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {DATETIME_FMT.format(new Date(patient.created_at))}
              {patient.registrar?.full_name ? ` by ${patient.registrar.full_name}` : ""}
            </dd>
          </div>
        </dl>
      </section>

      {/* --- MEDICAL HISTORY (UC-08 / FR-11) --- */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Medical history
          </h2>
          <span className="text-xs text-gray-400">
            {history.length} entr{history.length === 1 ? "y" : "ies"} · permanent record (FR-12)
          </span>
        </div>

        {history.length === 0 ? (
          <div className="mt-3 rounded-md border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-800">No clinical entries yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Entries are added by healthcare professionals during visits.
            </p>
            {canAddRecord && (
              <Link
                href={`/patients/${patient.id}/records/new`}
                className="mt-4 inline-flex rounded-sm bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Add the first entry
              </Link>
            )}
          </div>
        ) : (
          <ol className="mt-3 list-none space-y-4 p-0">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-gray-900">{entry.diagnosis}</p>
                  <time
                    dateTime={entry.visit_date}
                    className="text-xs font-medium text-gray-500"
                  >
                    {DATETIME_FMT.format(new Date(entry.visit_date))}
                  </time>
                </div>
                {entry.notes && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {entry.notes}
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  Authored by {entry.author?.full_name ?? "unknown staff"} — permanent entry
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}