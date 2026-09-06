import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RecordForm } from "@/components/record-form";
import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Add Clinical Entry",
};

export default async function NewRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const actor = await requirePermission("records.add");
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  const patient = (data ?? null) as unknown as PatientRow | null;
  if (!patient) notFound();

  return (
    <AppShell active="patients" profile={actor} width="narrow">
      <Link
        href={`/patients/${patient.id}`}
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to patient record
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">Add clinical entry</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
        For{" "}
        <span className="font-semibold text-gray-900">{patient.full_name}</span>
        <span className="rounded-full bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
          {patient.patient_code}
        </span>
      </p>

      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
        <RecordForm patientId={patient.id} />
      </section>
    </AppShell>
  );
}
