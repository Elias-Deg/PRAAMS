"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdministrator } from "@/lib/auth/session";
import {
  StaffActionState,
  StaffCreateSchema,
  StaffIdSchema,
  StaffUpdateSchema,
} from "@/lib/validation/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

/** Profiles-domain audit adapter keeping call sites terse. */
async function writeAudit(
  actorId: string,
  action: string,
  targetProfileId: string,
): Promise<void> {
  await writeAuditLog(actorId, action, "profiles", targetProfileId);
}

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

export async function createStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await requireAdministrator();

  const rawValues = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = StaffCreateSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const fields = parsed.data;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // Duplicate identity guard — clear messaging beats a buried Auth error.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", fields.email)
    .maybeSingle();
  if (existing) {
    return {
      status: "failed",
      values: rawValues,
      message: "An account with this email already exists.",
    };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: fields.email,
    password: fields.password,
    email_confirm: true,
    user_metadata: { full_name: fields.fullName, role: fields.role },
  });

  if (createErr || !created.user) {
    return {
      status: "failed",
      values: rawValues,
      message: "Could not create the account. Please try again.",
    };
  }

  // The handle_new_user trigger built the base row; upsert fills phone and
  // acts as a belt-and-braces backstop for every field.
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: created.user.id,
    full_name: fields.fullName,
    email: fields.email,
    role: fields.role,
    phone: fields.phone ?? null,
    status: "active",
  }, { onConflict: "id" });
  if (profileErr) {
    return {
      status: "failed",
      values: rawValues,
      message: "Account created but the profile could not be finalized. Contact IT support.",
    };
  }

  await writeAudit(actor.id, "CREATE_STAFF", created.user.id);

  revalidatePath("/admin/staff");
  redirect("/admin/staff?notice=created");
}

// --- lifecycle actions (update / deactivate / reactivate / delete) ---

export async function updateStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await requireAdministrator();

  const idParsed = StaffIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { status: "failed", message: "Invalid staff reference." };
  }
  const id = idParsed.data;

  const rawValues = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  const parsed = StaffUpdateSchema.safeParse(rawValues);
  if (!parsed.success) {
    return {
      status: "field-error",
      values: rawValues,
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  if (id === actor.id && parsed.data.role !== actor.role) {
    return {
      status: "failed",
      values: rawValues,
      message: "You cannot change your own role.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!target) {
    return { status: "failed", values: rawValues, message: "That account no longer exists." };
  }

  // Uses the RLS path on purpose: profiles_admin_write permits administrators.
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role,
    })
    .eq("id", id);

  if (updateErr) {
    return {
      status: "failed",
      values: rawValues,
      message: "The account could not be updated. Please try again.",
    };
  }

  await writeAudit(actor.id, "UPDATE_STAFF", id);

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${id}`);
  return { status: "saved" };
}

/** Desired end-state ("active"/"inactive") submitted from inline row forms. */
export async function toggleStaffStatus(formData: FormData): Promise<void> {
  const actor = await requireAdministrator();

  const idParsed = StaffIdSchema.safeParse(String(formData.get("id") ?? ""));
  const targetStatus = String(formData.get("targetStatus") ?? "");
  const valid =
    idParsed.success && (targetStatus === "active" || targetStatus === "inactive");
  if (!valid) redirect("/admin/staff?notice=error");

  const id = idParsed.data!;

  if (id === actor.id && targetStatus === "inactive") {
    redirect("/admin/staff?notice=err-self-deactivate");
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("email, role, status")
    .eq("id", id)
    .maybeSingle();
  if (!target) redirect("/admin/staff?notice=err-not-found");

  // Deactivation must never strand the clinic without an active administrator.
  if (targetStatus === "inactive" && target.role === "administrator") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "administrator")
      .eq("status", "active")
      .neq("id", id);
    if ((count ?? 0) < 1) redirect("/admin/staff?notice=err-last-admin");
  }

  const changed = target.status !== targetStatus;
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ status: targetStatus })
    .eq("id", id);
  if (updateErr) redirect("/admin/staff?notice=error");

  if (changed) {
    await writeAudit(
      actor.id,
      targetStatus === "inactive" ? "DEACTIVATE_STAFF" : "REACTIVATE_STAFF",
      id,
    );
    if (targetStatus === "active") {
      // Fresh slate for a returning account: clear failed-login counters.
      await admin.rpc("reset_failed_logins", { p_email: target.email });
    }
  }

  revalidatePath("/admin/staff");
  revalidatePath(`/admin/staff/${id}`);
  redirect(
    `/admin/staff?notice=${
      changed ? (targetStatus === "inactive" ? "deactivated" : "reactivated") : "noop"
    }`,
  );
}

/**
 * Hard account removal (FR-01). Refuses to orphan permanent clinical data:
 * staff who authored medical records or are linked to appointments cannot be
 * deleted — deactivation is offered instead. Deleting the last active
 * administrator is blocked as well.
 */
export async function deleteStaff(formData: FormData): Promise<void> {
  const actor = await requireAdministrator();

  const idParsed = StaffIdSchema.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) redirect("/admin/staff?notice=error");
  const id = idParsed.data!;

  if (id === actor.id) redirect("/admin/staff?notice=err-self-delete");

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("email, role, status")
    .eq("id", id)
    .maybeSingle();
  if (!target) redirect("/admin/staff?notice=err-not-found");

  // FR-12 permanence: authored entries must keep their authorship context.
  const [recordsRef, apptStaffRef, apptBookerRef] = await Promise.all([
    supabase.from("medical_records").select("id", { count: "exact" }).limit(1).eq("author_id", id),
    supabase.from("appointments").select("id", { count: "exact" }).limit(1).eq("staff_id", id),
    supabase.from("appointments").select("id", { count: "exact" }).limit(1).eq("scheduled_by", id),
  ]);
  if ((recordsRef.count ?? 0) > 0) redirect("/admin/staff?notice=err-authored-records");
  if ((apptStaffRef.count ?? 0) > 0 || (apptBookerRef.count ?? 0) > 0) {
    redirect("/admin/staff?notice=err-linked-appointments");
  }

  if (target.role === "administrator") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "administrator")
      .eq("status", "active")
      .neq("id", id);
    if ((count ?? 0) < 1) redirect("/admin/staff?notice=err-last-admin");
  }

  // Audit first: after deleteUser() cascades the profile away, target_id persists.
  await writeAudit(actor.id, "DELETE_STAFF", id);

  const { error: deleteErr } = await admin.auth.admin.deleteUser(id);
  if (deleteErr) redirect("/admin/staff?notice=error");

  await admin.rpc("reset_failed_logins", { p_email: target.email });

  revalidatePath("/admin/staff");
  redirect("/admin/staff?notice=deleted");
}
