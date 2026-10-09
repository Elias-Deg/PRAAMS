import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { ADDIS_UTC_OFFSET, todayInAddis } from "@/lib/constants";
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

/**
 * UC-06 · FR-09 — patient register in the login/dashboard design language
 * (§14): gradient hero with live counts, pill search, pill rows with a
 * staggered pop-in, and playful hover affordances.
 */
export default async function PatientsPage({
  searchParams,
}: PageProps<"/patients">): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const mayRegister = await can(profile.role, "patients.create");

  const supabase = await createSupabaseServerClient();

  let rows: PatientRow[] = [];
  let totalCount = 0;
  let searched = false;

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
    const res = await base
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    rows = (res.data ?? []) as unknown as PatientRow[];
    totalCount = res.count ?? 0;
  }

  // Hero stats — always live.
  const monthStart = `${todayInAddis().slice(0, 7)}-01`;
  const [totalC, newC] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact" }).limit(1),
    supabase
      .from("patients")
      .select("id", { count: "exact" })
      .gte("created_at", `${monthStart}T00:00:00${ADDIS_UTC_OFFSET}`)
      .limit(1),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Hero — login-style gradient banner */}
      <section className="relative isolate animate-pop-in overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-light p-6 text-white shadow-pop sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-6 -z-10 h-24 w-24 animate-float rounded-full bg-white/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -z-10 bottom-2 right-28 h-12 w-12 animate-float rounded-full bg-white/10 [animation-delay:900ms]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-5 -z-10 bottom-6 h-16 w-16 animate-float rounded-full bg-white/15 [animation-delay:1.6s]"
        />
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white/75">
              Patient register
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Patients</h1>
            <p className="mt-1.5 max-w-md text-sm text-white/85">
              Search by name, patient code or phone — or browse the latest
              registrations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="font-display text-2xl font-bold leading-none">
                {(totalC.count ?? 0).toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                On file
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="font-display text-2xl font-bold leading-none">
                +{(newC.count ?? 0).toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                This month
              </p>
            </div>
            {mayRegister && (
              <Link
                href="/patients/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-3 font-display text-sm font-bold text-accent shadow-pop transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
              >
                <Icon name="plus" className="h-4 w-4" />
                Register patient
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Pill search */}
      <form
        action="/patients"
        method="get"
        role="search"
        className="relative mt-5 animate-pop-in [animation-delay:120ms]"
      >
        <Icon
          name="search"
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, patient code (e.g. P-0198) or phone…"
          aria-label="Search patients by name, code or phone"
          className="h-14 w-full rounded-full border-2 border-transparent bg-white py-3.5 pl-13 pr-26 text-sm text-gray-900 shadow-soft outline-none transition-all placeholder:text-gray-400 focus:border-accent focus:shadow-pop sm:pr-32"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-pop transition-all hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-[0.98]"
        >
          Search
        </button>
      </form>
      {searched && (
        <p className="mt-3 animate-pop-in text-sm text-gray-500">
          Results for “{q}” — {rows.length} match{rows.length === 1 ? "" : "es"}.{" "}
          <Link
            href="/patients"
            className="font-semibold text-navy hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Clear search
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-5 animate-pop-in rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-soft [animation-delay:200ms]">
          <p className="font-display text-base font-bold text-gray-900">
            {searched ? `No patients match “${q}”` : "No patients registered yet"}
          </p>
          <p className="mt-1.5 text-sm text-gray-500">
            {searched
              ? "Try a different name, the exact patient code, or a phone fragment."
              : "Register the first patient to start building the clinic register."}
          </p>
          {mayRegister && (
            <Link
              href="/patients/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Icon name="plus" className="h-4 w-4" />
              {searched ? "Register a patient" : "Register first patient"}
            </Link>
          )}
        </div>
      ) : (
        <section
          aria-label={searched ? "Search results" : "Recent registrations"}
          className="mt-5 animate-pop-in rounded-3xl bg-white p-4 shadow-soft [animation-delay:200ms]"
        >
          <p className="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            {searched
              ? `${rows.length} match${rows.length === 1 ? "" : "es"}`
              : `Latest registrations · page ${page} of ${totalPages}`}
          </p>
          <ul className="list-none space-y-2 p-0">
            {rows.map((patient, i) => (
              <li
                key={patient.id}
                className="animate-pop-in"
                style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
              >
                <Link
                  href={`/patients/${patient.id}`}
                  className="group flex items-center gap-4 rounded-full bg-surface px-4 py-3 transition-all duration-200 hover:bg-navy-tint hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <Avatar name={patient.full_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[15px] font-bold text-gray-900">
                      <span className="truncate">{patient.full_name}</span>
                      <span className="shrink-0 rounded-full bg-navy-tint px-2 py-0.5 text-[10px] font-bold text-navy">
                        {patient.patient_code}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} ·{" "}
                      {ageFrom(patient.date_of_birth)} yrs · {patient.phone ?? "no phone"}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-gray-400 sm:block">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                      new Date(patient.created_at),
                    )}
                  </span>
                  <Icon
                    name="chevron"
                    className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:animate-wiggle group-hover:text-navy"
                  />
                </Link>
              </li>
            ))}
          </ul>

          {!searched && totalPages > 1 && (
            <nav
              aria-label="Patient pages"
              className="mt-4 flex items-center justify-center gap-3 pb-1"
            >
              {page > 1 ? (
                <Link
                  href={`/patients?page=${page - 1}`}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-navy transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <Icon name="chevron" className="h-3.5 w-3.5 -scale-x-100" />
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-300">
                  <Icon name="chevron" className="h-3.5 w-3.5 -scale-x-100" />
                  Previous
                </span>
              )}
              <span className="text-xs font-semibold text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/patients?page=${page + 1}`}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-navy transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  Next
                  <Icon name="chevron" className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-300">
                  Next
                  <Icon name="chevron" className="h-3.5 w-3.5" />
                </span>
              )}
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
