import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PatientForm } from "@/components/patient-form";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Edit Patient",
};

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermission("patients.edit");
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  const patient = (data ?? null) as unknown as PatientRow | null;
  if (!patient) notFound();

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/patients/${patient.id}`}
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to patient record
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">Edit demographics</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
        <span className="rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
          {patient.patient_code}
        </span>
        Updates are logged to the audit trail (UC-05).
      </p>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <PatientForm
          mode="edit"
          patientId={patient.id}
          initial={{
            fullName: patient.full_name,
            dateOfBirth: patient.date_of_birth,
            gender: patient.gender,
            phone: patient.phone ?? "",
            address: patient.address ?? "",
            emergencyContact: patient.emergency_contact ?? "",
          }}
        />
      </section>
    </main>
  );
}