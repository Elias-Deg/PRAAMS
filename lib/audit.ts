import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditLogInsert } from "@/types/database";

/**
 * Shared audit writer (§4 rule: every mutating action on clinic data writes an
 * audit_logs row; FR-12 permanence / NFR-10 trail).
 *
 * Server-side only — call from Server Actions / Route Handlers. The row is
 * inserted through the RLS-scoped anon client under `audit_insert_all`, never
 * through the service-role client, so least privilege stays intact.
 *
 * Throws on failure: mutating actions must fail loudly rather than succeed
 * silently without their audit entry.
 */
export async function writeAuditLog(
  userId: string,
  action: string,
  targetEntity: string,
  targetId: string | null,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const payload = {
    user_id: userId,
    action,
    target_entity: targetEntity,
    target_id: targetId,
  } satisfies AuditLogInsert;
  const { error } = await supabase.from("audit_logs").insert(payload);
  if (error) throw error;
}