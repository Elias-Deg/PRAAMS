import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

/**
 * UC-03 capability catalogue.
 *
 * Toggleable grants narrow the effective capabilities of a role beneath the
 * Postgres RLS baseline (they can never widen it — the database remains the
 * final authority). `staff.manage` is deliberately fixed: administrators must
 * always retain control of accounts, otherwise the permissions screen itself
 * could become unreachable.
 */

export const TOGGLEABLE_PERMISSIONS = [
  "patients.create",
  "patients.edit",
  "records.add",
  "appointments.schedule",
  "reports.generate",
] as const;

export type ToggleablePermission = (typeof TOGGLEABLE_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<string, string> = {
  "patients.create": "Register new patients",
  "patients.edit": "Edit patient information",
  "records.add": "Add medical record entries",
  "appointments.schedule": "Schedule / cancel appointments",
  "reports.generate": "Generate administrative reports",
  "staff.manage": "Manage staff accounts",
};

const ROLES: UserRole[] = ["receptionist", "healthcare_professional", "administrator"];

/**
 * Per-request cached view of the granted matrix: role → set of permissions.
 * Missing rows mean "not granted". Defaults drift toward fail-closed.
 */
export const getGrantedMatrix = cache(
  async (): Promise<Record<UserRole, Set<string>>> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("role_permissions").select("role, permission");

    const matrix: Record<UserRole, Set<string>> = {
      receptionist: new Set<string>(),
      healthcare_professional: new Set<string>(),
      administrator: new Set<string>(),
    };
    for (const row of (data ?? []) as { role: UserRole; permission: string }[]) {
      matrix[row.role].add(row.permission);
    }
    // Fixed built-in rule.
    ROLES.forEach((r) =>
      r === "administrator"
        ? matrix[r].add("staff.manage")
        : matrix[r].delete("staff.manage"),
    );
    return matrix;
  },
);

export async function can(role: UserRole, permission: string): Promise<boolean> {
  if (permission === "staff.manage") return role === "administrator";
  const matrix = await getGrantedMatrix();
  return matrix[role].has(permission);
}

export const ALL_ROLES = ROLES;