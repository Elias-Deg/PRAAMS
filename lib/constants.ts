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