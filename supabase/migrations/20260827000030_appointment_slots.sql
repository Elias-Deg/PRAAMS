-- ============================================================================
-- PRAAMS — Appointment slot integrity (Phase 4: FR-13/14/15)
--
-- Double-booking is impossible at the database level: only ONE appointment may
-- hold a 'scheduled' status for a given (staff_id, date_time) pair. Cancelling
-- or completing frees the slot; reschedule moves it atomically.
-- A parallel index keeps a patient from being booked into two rooms at once.
--
-- Applied via Dashboard → SQL Editor, like the earlier migrations.
-- ============================================================================

-- One active booking per healthcare-professional slot (FR-15).
create unique index if not exists appointments_one_active_per_slot
  on public.appointments (staff_id, date_time)
  where status = 'scheduled';

-- A patient cannot be in two appointments at the same instant either.
create unique index if not exists appointments_patient_one_active_per_slot
  on public.appointments (patient_id, date_time)
  where status = 'scheduled';