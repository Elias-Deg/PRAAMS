import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — BYPASSES ALL RLS.
 *
 * Guardrails:
 * - `server-only` makes any import from Client Components fail at build time.
 * - Server-only utility for privileged operations that are genuinely outside
 *   RLS's reach (admin staff provisioning, re-authenticated flows).
 * - The service-role key is never prefixed NEXT_PUBLIC_, so it is never
 *   bundled into client code even by accident.
 *
 * Every mutation performed here must still write its own audit_logs row —
 * see lib/audit.ts when Phase 1+ wires it into flows.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}