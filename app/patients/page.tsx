import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Patients",
};

const PAGE_SIZE = 20;

function ageFrom(dob: string): number {
  const born = new Date(dob);
  const diff = Date.now() - born.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** UC-06 · FR-09 — search by name / patient code / phone, else recent registrations. */
export default async function PatientsPage({
  searchParams,
}: PageProps<"/patients">): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const supabase = await createSupabaseServerClient();
  const mayRegister = profile ? await can(profile.role, "patients.create") : false;

  let rows: PatientRow[] = [];
  let totalCount = 0;
  let searched = false;
  let searchError: string | null = null;

  if (q.length > 0) {
    searched = true;
    const term = q.replace(/[%_,()]/g, "");
    const [byName, byPhone, byCode] = await Promise.all([
      supabase.from("patients").select("*").ilike("full_name", `%${term}%`).limit(30),
      supabase.from("patients").select("*").ilike("phone", `%${term}%`).limit(30),
      supabase.from("patients").select("*").eq("patient_code", q.toUpperCase()).limit(10),
    ]);
    const map = new Map<string, PatientRow>();
    for (const res of [byName, byPhone, byCode]) {
      for (const row of (res.data ?? []) as unknown as PatientRow[]) {
        map.set(row.id, row);
      }
    }
    rows = Array.from(map.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name),
    );
  } else {
    const from = (page - 1) * PAGE_SIZE;
    const base = supabase.from("patients").select("*", { count: "exact" });
    const res = await base.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    rows = (res.data ?? []) as unknown as PatientRow[];
    totalCount = res.count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  void searchError;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Patients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Search the register or browse recent registrations (UC-06).
          </p>
        </div>
        {mayRegister && (
          <Link
            href="/patients/new"
            className="rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            + Register patient
          </Link>
        )}
      </div>

      {/* --- SEARCH FORM --- */}
      <form action="/patients" method="get" className="mt-6 flex gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, patient code (e.g. P-0198) or phone…"
          aria-label="Search patients by name, code or phone"
          className="block w-full rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light"
        />
        <button
          type="submit"
          className="shrink-0 rounded-sm border border-navy bg-white px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Search
        </button>
        {searched && (
          <Link
            href="/patients"
            className="flex items-center rounded-sm px-3 py-2.5 text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Clear
          </Link>
        )}
      </form>

      {/* --- RESULTS / EMPTY STATES --- */}
      {rows.length === 0 ? (
        <div className="mt-8 rounded-md border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-800">
            {searched ? `No patients match “${q}”` : "No patients registered yet"}
          </p>
          <p className="mt-1.5 text-sm text-gray-500">
            {searched
              ? "Try a different name, the exact patient code, or a phone fragment."
              : "Register the first patient to start building the clinic register."}
          </p>
          {!searched && mayRegister && (
            <Link
              href="/patients/new"
              className="mt-5 inline-flex rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Register first patient
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gray-400">
            {searched ? `${rows.length} match${rows.length === 1 ? "" : "es"}` : `${totalCount} on file`}
          </p>
          <ul className="mt-2 grid list-none gap-3 p-0">
            {rows.map((patient) => (
              <li key={patient.id}>
                <Link
                  href={`/patients/${patient.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-navy-light hover:bg-navy-tint/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <div className="min-w-[220px]">
                    <span className="font-semibold text-gray-900">{patient.full_name}</span>
                    <span className="ml-3 rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
                      {patient.patient_code}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} ·{" "}
                    {ageFrom(patient.date_of_birth)} yrs ·{" "}
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(
                      new Date(patient.date_of_birth),
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{patient.phone ?? "—"}</div>
                </Link>
              </li>
            ))}
          </ul>

          {/* --- PAGINATION (recent mode only) --- */}
          {!searched && totalPages > 1 && (
            <nav aria-label="Patient pages" className="mt-6 flex items-center justify-center gap-4">
              {page > 1 ? (
                <Link
                  href={`/patients?page=${page - 1}`}
                  className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-300">
                  ← Previous
                </span>
              )}
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/patients?page=${page + 1}`}
                  className="rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-300">
                  Next →
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}