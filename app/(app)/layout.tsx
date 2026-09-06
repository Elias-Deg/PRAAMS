import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Shared authenticated layout (route group "(app)" — URL-preserving).
 * Owns the persistent AppShell so the sidebar never remounts between pages;
 * segment loading.tsx files render inside it, already wearing the final design.
 * Re-verifies the session server-side (proxy stays the outer gate).
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

  return <AppShell profile={profile}>{children}</AppShell>;
}