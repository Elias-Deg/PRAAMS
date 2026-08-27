"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdministrator } from "@/lib/auth/session";
import { TOGGLEABLE_PERMISSIONS } from "@/lib/permissions/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

const ToggleSchema = z.object({
  role: z.enum(["receptionist", "healthcare_professional", "administrator"]),
  permission: z.string(),
  enable: z.enum(["true", "false"]),
});

/**
 * UC-03 — flips one capability grant for one role. Grants may only narrow
 * what Postgres RLS already allows; `staff.manage` is a fixed built-in rule
 * handled in application code and rejected here.
 */
export async function toggleRolePermission(formData: FormData): Promise<void> {
  const actor = await requireAdministrator();

  const parsed = ToggleSchema.safeParse({
    role: String(formData.get("role") ?? ""),
    permission: String(formData.get("permission") ?? ""),
    enable: String(formData.get("enable") ?? ""),
  });
  if (!parsed.success) redirect("/admin/permissions?notice=error");

  const { role, permission, enable } = parsed.data;
  const toggleable = (TOGGLEABLE_PERMISSIONS as readonly string[]).includes(permission);
  if (!toggleable) redirect("/admin/permissions?notice=error");

  const supabase = await createSupabaseServerClient();

  if (enable === "true") {
    const { error } = await supabase
      .from("role_permissions")
      .upsert({ role, permission }, { onConflict: "role,permission" });
    if (error) redirect("/admin/permissions?notice=error");
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role", role)
      .eq("permission", permission);
    if (error) redirect("/admin/permissions?notice=error");
  }

  await writeAuditLog(
    actor.id,
    `UPDATE_ROLE_PERMISSION role=${role} permission=${permission} enabled=${enable}`,
    "role_permissions",
    null,
  );

  revalidatePath("/admin/permissions");
  revalidatePath("/dashboard");
  redirect("/admin/permissions?notice=saved");
}