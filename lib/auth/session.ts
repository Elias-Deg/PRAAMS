import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Resolves the signed-in operator's profile row inside a single render pass.
 * Cached per request so layouts/pages/actions can call freely without extra
 * round-trips. Uses getUser() — the JWT is validated with the Auth server —
 * then reads `profiles` through RLS (self-read policy). Authorization checks
 * built on this run server-side, satisfying §7's requirement that roles are
 * enforced beyond hiding UI elements.
 */
export const getCurrentProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return (profile as unknown as ProfileRow) ?? null;
});

/**
 * Server-side gate for administrator-only routes and actions (UC-02, UC-03).
 * Safe against direct POSTs to Server Actions — caller must hold an active
 * administrator profile or navigation lands on /dashboard. Used together
 * with RLS, which stays the true enforcement boundary underneath.
 */
export async function requireAdministrator(): Promise<ProfileRow> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active" || profile.role !== "administrator") {
    redirect("/dashboard");
  }
  return profile;
}

/**
 * Generalized capability gate (UC-03 doctrine): caller must be an active
 * staff member whose role holds the capability grant. Applies the same
 * redirect-on-failure posture as requireAdministrator; reads the live
 * role_permissions matrix so toggles take effect immediately.
 */
export async function requirePermission(permission: string): Promise<ProfileRow> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }
  const { can } = await import("@/lib/permissions/data");
  const allowed = await can(profile.role, permission);
  if (!allowed) {
    redirect("/dashboard");
  }
  return profile;
}