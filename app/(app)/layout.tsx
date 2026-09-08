import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Shared authenticated layout (route group "(app)" — URL-preserving).
 * Owns the persistent AppShell so the sidebar never remounts between pages;
 * segment loading.tsx files render inside it, already wearing the final design.
 * Re-verifies the session server-side (proxy stays the outer gate).
 * Also feeds the sidebar hero card its live registered-patients count.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { count: patientCount } = await supabase
    .from("patients")
    .select("id", { count: "exact" })
    .limit(1);

  return (
    <AppShell profile={profile} patientCount={patientCount ?? 0}>
      {children}
    </AppShell>
  );
}