/**
 * Hand-written mirror of supabase/migrations/20260827000000_init_praams.sql.
 * Regenerate via `npx supabase gen types typescript` once the CLI is linked;
 * until then keep this file in lockstep with the migration.
 */

export type UserRole =
  | "receptionist"
  | "healthcare_professional"
  | "administrator";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type ProfileStatus = "active" | "inactive";

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  status: ProfileStatus;
  created_at: string;
}

export interface PatientRow {
  id: string;
  /** Display code (e.g. P-0198) — flagged addition, see migration comments. */
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  registered_by: string | null;
  created_at: string;
}

export type PatientInsert = Omit<PatientRow, "id" | "created_at">;

export type PatientUpdate = Partial<
  Omit<PatientRow, "id" | "created_at" | "patient_code">
>;

export interface MedicalRecordRow {
  id: string;
  patient_id: string;
  author_id: string;
  visit_date: string;
  diagnosis: string;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
}

/** FR-12: medical records are permanent — insert-only model, no update type. */
export type MedicalRecordInsert = Omit<
  MedicalRecordRow,
  "id" | "created_at"
>;

export interface AppointmentRow {
  id: string;
  patient_id: string;
  staff_id: string;
  scheduled_by: string;
  date_time: string;
  status: AppointmentStatus;
  reason: string | null;
  created_at: string;
}

export type AppointmentInsert = Omit<AppointmentRow, "id" | "created_at">;

export type AppointmentUpdate = Partial<Omit<AppointmentRow, "id" | "created_at">>;

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  target_entity: string | null;
  target_id: string | null;
  timestamp: string;
}

export type AuditLogInsert = Pick<AuditLogRow, "action"> &
  Partial<Pick<AuditLogRow, "user_id" | "target_entity" | "target_id">>;

/** UC-03 capability grant row — see migration 20260827000020. */
export interface RolePermissionRow {
  role: UserRole;
  permission: string;
}
