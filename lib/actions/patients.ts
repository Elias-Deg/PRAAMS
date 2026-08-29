"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import {
  MedicalRecordSchema,
  PatientActionState,
  PatientFieldsSchema,
  PatientIdSchema,
} from "@/lib/validation/patient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fieldErrorsOf(error: unknown): Record<string, string> {
  const flat =
    (error as {
      flatten?: () => { fieldErrors?: Record<string, string[] | undefined> };
    }).flatten?.().fieldErrors ?? {};
  const out: Record<string, string> = {};
  Object.entries(flat).forEach(([key, messages]) => {
    const message = messages?.[0];
    if (message) out[key] = message;
  });
  return out;
}

/**
 * UC-04 · FR-06/FR-07 — registers a patient. Before inserting we look for
 * potential duplicates on name **and** (phone or DOB); matches are *flagged*,
 * never blocking (FR-07), via ?dup=<ids> surfaced on the detail page.
 */
export async function createPatient(
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  await requirePermission("patients.create");

  const rawValues = {
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    emergencyContact: String(formData.get("emergencyContact") ?? ""),
  };

  const parsed = PatientFieldsSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const fields = parsed.data;

  const supabase = await createSupabaseServerClient();

  // --- FR-07 duplicate scan: same name AND (same phone OR same DOB). --------
  const safeName = fields.fullName.replace(/[%_,()]/g, "");
  const [byPhone, byDob] = await Promise.all([
    fields.phone
      ? supabase
          .from("patients")
          .select("id")
          .ilike("full_name", safeName)
          .eq("phone", fields.phone)
          .limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      .from("patients")
      .select("id")
      .ilike("full_name", safeName)
      .eq("date_of_birth", fields.dateOfBirth)
      .limit(5),
  ]);
  const dupIds = Array.from(
    new Set(
      [...((byPhone.data ?? []) as { id: string }[]), ...((byDob.data ?? []) as { id: string }[])].map(
        (row) => row.id,
      ),
    ),
  );

  const actor = await requirePermission("patients.create");
  const { data: inserted, error } = await supabase
    .from("patients")
    .insert({
      full_name: fields.fullName,
      date_of_birth: fields.dateOfBirth,
      gender: fields.gender,
      phone: fields.phone ?? null,
      address: fields.address ?? null,
      emergency_contact: fields.emergencyContact ?? null,
      registered_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      status: "failed",
      values: rawValues,
      message: "Could not register the patient. Please try again.",
    };
  }

  await writeAuditLog(actor.id, "INSERT_PATIENT", "patients", inserted.id);

  revalidatePath("/patients");
  redirect(
    `/patients/${inserted.id}?notice=created${dupIds.length > 0 ? `&dup=${dupIds.join(",")}` : ""}`,
  );
}

// --- UC-05 demographic updates & UC-07 clinical entries ---

/** UC-05 · FR-08 — updates demographics; stays on the edit page with "Saved.". */
export async function updatePatient(
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const actor = await requirePermission("patients.edit");

  const idParsed = PatientIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { status: "failed", message: "Invalid patient reference." };
  }
  const id = idParsed.data;

  const rawValues = {
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    emergencyContact: String(formData.get("emergencyContact") ?? ""),
  };

  const parsed = PatientFieldsSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: target } = await supabase
    .from("patients")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!target) {
    return { status: "failed", values: rawValues, message: "That patient no longer exists." };
  }

  // RLS path (patients_update_staff) — no service-role involvement.
  const { error } = await supabase
    .from("patients")
    .update({
      full_name: parsed.data.fullName,
      date_of_birth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      emergency_contact: parsed.data.emergencyContact ?? null,
    })
    .eq("id", id);

  if (error) {
    return {
      status: "failed",
      values: rawValues,
      message: "Could not save the changes. Please try again.",
    };
  }

  await writeAuditLog(actor.id, "UPDATE_PATIENT", "patients", id);

  revalidatePath(`/patients/${id}`);
  revalidatePath("/patients");
  return { status: "saved" };
}

/** UC-07 · FR-10 — appends a permanent clinical entry; HP capability enforced. */
export async function addMedicalRecord(
  _prevState: PatientActionState,
  formData: FormData,
): Promise<PatientActionState> {
  const actor = await requirePermission("records.add");

  const patientId = String(formData.get("patientId") ?? "");
  const idParsed = PatientIdSchema.safeParse(patientId);
  if (!idParsed.success) {
    return { status: "failed", message: "Invalid patient reference." };
  }

  const rawValues = {
    visitDate: String(formData.get("visitDate") ?? ""),
    diagnosis: String(formData.get("diagnosis") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = MedicalRecordSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", idParsed.data)
    .maybeSingle();
  if (!patient) {
    return { status: "failed", values: rawValues, message: "That patient no longer exists." };
  }

  const { data: record, error } = await supabase
    .from("medical_records")
    .insert({
      patient_id: idParsed.data,
      author_id: actor.id,
      visit_date: new Date(parsed.data.visitDate).toISOString(),
      diagnosis: parsed.data.diagnosis,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !record) {
    return {
      status: "failed",
      values: rawValues,
      message: "Could not add the entry. Please try again.",
    };
  }

  await writeAuditLog(actor.id, "INSERT_MEDICAL_RECORD", "medical_records", record.id);

  revalidatePath(`/patients/${idParsed.data}`);
  redirect(`/patients/${idParsed.data}?notice=record-added`);
}
