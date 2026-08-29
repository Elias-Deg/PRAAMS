/**
 * Auth policy constants — single source of truth for Phase 1 security limits.
 *
 * Assumptions (flagged, conservative defaults):
 * - UC-01 lockout: 5 consecutive failures locks the account for 30 minutes.
 *   Mirrored in supabase/migrations/20260827000010_login_security.sql — keep
 *   the two definitions in sync if requirements change.
 * - FR-05 session auto-termination: sessions terminate after 30 minutes of
 *   browser inactivity (activity = pointer moves, keys, clicks, scrolling).
 */
export const LOCKOUT_MAX_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 30;
export const INACTIVITY_TIMEOUT_MINUTES = 30;

export const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

/** Cookie storing the epoch-ms timestamp of the user's last interaction. */
export const LAST_ACTIVE_COOKIE = "praams_last_active";

/* ---------------------------------------------------------------------------
 * Clinic scheduling parameters (Phase 4 assumptions — flagged):
 *  - Working day 09:00–17:00 East Africa Time (fixed UTC+3, no DST in Ethiopia),
 *    30-minute slots, last slot starts 16:30.
 *  - Sundays closed; Monday–Saturday open.
 *  - No lunch-break hole (keep the model simple unless the SRS says otherwise).
 * ------------------------------------------------------------------------- */
export const ADDIS_UTC_OFFSET = "+03:00";
export const CLINIC_OPEN_HOUR = 9;
export const CLINIC_CLOSE_HOUR = 17;
export const CLINIC_SLOT_MINUTES = 30;
/** 0 = Sunday (getUTCDay semantics). */
export const CLINIC_CLOSED_WEEKDAYS = [0];

/** Today's calendar date as seen in Addis Ababa (YYYY-MM-DD). */
export function todayInAddis(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Generates the clinic's bookable slot instants for an Addis calendar date. */
export function generateDaySlots(dateISO: string): string[] {
  const weekday = new Date(`${dateISO}T00:00:00Z`).getUTCDay();
  if (CLINIC_CLOSED_WEEKDAYS.includes(weekday)) return [];

  const slots: string[] = [];
  const openMinutes = CLINIC_OPEN_HOUR * 60;
  const closeMinutes = CLINIC_CLOSE_HOUR * 60;
  for (let m = openMinutes; m <= closeMinutes - CLINIC_SLOT_MINUTES; m += CLINIC_SLOT_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${dateISO}T${hh}:${mm}:00${ADDIS_UTC_OFFSET}`);
  }
  return slots;
}