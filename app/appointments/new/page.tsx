import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppointmentBookingForm } from "@/components/appointment-booking-form";
import { requirePermission } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New Booking",
};

/** UC-09 · FR-13/14 — schedule a patient with an available professional. */
export default async function NewAppointmentPage({
  searchParams,
}: PageProps<"/appointments/new">): Promise<React.ReactElement> {
  const actor = await requirePermission("appointments.schedule");
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();

  const { data: hps } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "healthcare_professional")
    .eq("status", "active")
    .order("full_name");
  const hpList = (hps ?? []) as { id: string; full_name: string }[];

  let preselected: { id: string; label: string } | undefined;
  const patientParam = typeof params.patient === "string" ? params.patient : "";
  if (/^[0-9a-f-]{36}$/i.test(patientParam)) {
    const { data: patient } = await supabase
      .from("patients")
      .select("full_name, patient_code")
      .eq("id", patientParam)
      .maybeSingle();
    if (patient) {
      const row = patient as { full_name: string; patient_code: string };
      preselected = { id: patientParam, label: `${row.full_name} (${row.patient_code})` };
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/appointments"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to calendar
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">Schedule appointment</h1>
      <p className="mt-1 text-sm text-gray-600">
        Booking as {actor.full_name}. Slots update live; if someone books the same slot
        first, the system will tell you before anything is saved (FR-15).
      </p>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <AppointmentBookingForm hps={hpList} preselectedPatient={preselected} />
      </section>
    </main>
  );
}