-- ============================================================================
-- PRAAMS — Staff directory visibility (approved during visual pass §3)
--
-- Why: colleague names are required by FR-13/FR-14 (booking dropdown for
-- receptionists), FR-17 (schedule attribution) and the dashboard tooltips.
-- The original self-or-admin SELECT policy hid colleagues from non-admin
-- staff. This policy widens read access to the staff directory (display
-- fields only — patients are never users of this system) for any
-- authenticated staff member. Write access stays administrator-only.
-- Owner-approved: yes (visual pass §3 decision).
-- ============================================================================

create policy "profiles_staff_read" on public.profiles for select
  using (auth.role() = 'authenticated');