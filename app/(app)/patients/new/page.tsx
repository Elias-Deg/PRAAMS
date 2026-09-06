import type { Metadata } from "next";
import Link from "next/link";

import { PatientForm } from "@/components/patient-form";import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Register Patient",
};

export default async function NewPatientPage(): Promise<React.ReactElement> {
  const actor = await requirePermission("patients.create");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/patients"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to patients
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">Register new patient</h1>
      <p className="mt-1 text-sm text-gray-600">
        Registering as {actor.full_name}. If the name matches an existing record with the
        same phone or date of birth, the system will flag possible duplicates after
        saving — it never blocks registration (FR-07).
      </p>

      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
        <PatientForm mode="create" />
      </section>
    </div>
  );
}


