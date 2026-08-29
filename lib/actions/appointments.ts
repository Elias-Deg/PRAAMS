"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import {
  AppointmentActionState,
  AppointmentIdSchema,
  RescheduleSchema,
  ScheduleSchema,
} from "@/lib/validation/appointments";
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

const SLOT_TAKEN =
  "That slot was just taken. Please pick a different time (FR-15 conflict handling).";

/** UC-09 · FR-13/15 — books a patient with an available HP at a free slot. */
export async function scheduleAppointment(
  _prevState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const actor = await requirePermission("appointments.schedule");

  const rawValues = {
    patientId: String(formData.get("patientId") ?? ""),
    staffId: String(formData.get("staffId") ?? ""),
    dateTime: String(formData.get("dateTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };

  const parsed = ScheduleSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const fields = parsed.data;
  const instant = new Date(fields.dateTime).toISOString();

  const supabase = await createSupabaseServerClient();

  // The booking target must be an ACTIVE healthcare professional.
  const { data: staff } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", fields.staffId)
    .maybeSingle();
  if (!staff || staff.role !== "healthcare_professional" || staff.status !== "active") {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: { staffId: "Choose an active healthcare professional." },
    };
  }

  // Patient must exist.
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", fields.patientId)
    .maybeSingle();
  if (!patient) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: { patientId: "That patient no longer exists." },
    };
  }

  // Alternative flow (UC-09): the slot may have been taken while the form was
  // open — recheck before insert; the partial unique index is the final arbiter.
  const { data: clash } = await supabase
    .from("appointments")
    .select("id")
    .eq("staff_id", fields.staffId)
    .eq("date_time", instant)
    .eq("status", "scheduled")
    .maybeSingle();
  if (clash) {
    return { status: "failed", values: rawValues, message: SLOT_TAKEN };
  }

  const { data: booked, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: fields.patientId,
      staff_id: fields.staffId,
      scheduled_by: actor.id,
      date_time: instant,
      reason: fields.reason ?? null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !booked) {
    if (error?.code === "23505") {
      return { status: "failed", values: rawValues, message: SLOT_TAKEN };
    }
    return {
      status: "failed",
      values: rawValues,
      message: "Could not schedule the appointment. Please try again.",
    };
  }

  await writeAuditLog(actor.id, "INSERT_APPOINTMENT", "appointments", booked.id);

  revalidatePath("/appointments");
  redirect(`/appointments?notice=scheduled&date=${instant.slice(0, 10)}`);
}

// --- UC-10 reschedule / cancel ---

/** UC-10 · FR-16 — moves a scheduled appointment to a new free slot. */
export async function rescheduleAppointment(
  _prevState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const actor = await requirePermission("appointments.schedule");

  const rawValues = {
    id: String(formData.get("id") ?? ""),
    dateTime: String(formData.get("dateTime") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };

  const parsed = RescheduleSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const instant = new Date(parsed.data.dateTime).toISOString();

  const { data: appt } = await supabase
    .from("appointments")
    .select("status, staff_id, patient_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!appt) {
    return { status: "failed", values: rawValues, message: "That appointment no longer exists." };
  }
  if (appt.status !== "scheduled") {
    return {
      status: "failed",
      values: rawValues,
      message: "Completed or cancelled appointments cannot be rescheduled.",
    };
  }

  // Slot-taken race (UC-10 alternative flow), excluding this appointment itself.
  const { data: clash } = await supabase
    .from("appointments")
    .select("id")
    .eq("staff_id", appt.staff_id)
    .eq("date_time", instant)
    .eq("status", "scheduled")
    .neq("id", parsed.data.id)
    .maybeSingle();
  if (clash) {
    return { status: "failed", values: rawValues, message: SLOT_TAKEN };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ date_time: instant, reason: parsed.data.reason ?? null })
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") {
      return { status: "failed", values: rawValues, message: SLOT_TAKEN };
    }
    return {
      status: "failed",
      values: rawValues,
      message: "Could not reschedule. Please try again.",
    };
  }

  await writeAuditLog(actor.id, "RESCHEDULE_APPOINTMENT", "appointments", parsed.data.id);

  revalidatePath(`/appointments/${parsed.data.id}`);
  revalidatePath("/appointments");
  redirect(`/appointments?notice=rescheduled&date=${instant.slice(0, 10)}`);
}

/** UC-10 · FR-16 — cancels a scheduled appointment (confirm dialog upstream). */
export async function cancelAppointment(formData: FormData): Promise<void> {
  const actor = await requirePermission("appointments.schedule");

  const idParsed = AppointmentIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) redirect("/appointments?notice=error");

  const supabase = await createSupabaseServerClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("status, date_time")
    .eq("id", idParsed.data)
    .maybeSingle();
  if (!appt) redirect("/appointments?notice=err-not-found");

  if (appt.status !== "scheduled") {
    redirect(`/appointments/${idParsed.data}?notice=err-terminal`);
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", idParsed.data);
  if (error) redirect("/appointments?notice=error");

  await writeAuditLog(actor.id, "CANCEL_APPOINTMENT", "appointments", idParsed.data);

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${idParsed.data}`);
  redirect(`/appointments?notice=cancelled&date=${appt.date_time.slice(0, 10)}`);
}
