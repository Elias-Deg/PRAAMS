-- ============================================================================
-- PRAAMS — User management foundations (Phase 2: UC-02, UC-03)
--
-- 1. role_permissions: stores the administrator-configurable capability
--    matrix behind FR-04/UC-03. DEVIATION (flagged): §4's contract had no
--    permissions table; this adds the smallest possible store — (role,
--    permission) grant rows. Grants can only NARROW what Postgres RLS
--    already permits, never widen it, so security stays anchored in the DB.
--
--    Fixed exception: `staff.manage` is intentionally non-toggleable and is
--    enforced as administrator-only in application code — otherwise an
--    administrator could lock themselves out of account administration.
--
-- 2. Referential adjustments needed because FR-01 allows DELETING accounts:
--    - audit_logs.user_id        → ON DELETE SET NULL (audit rows survive;
--                                  the deleted actor is anonymized, which is
--                                  the correct posture for a permanent log).
--    - patients.registered_by    → ON DELETE SET NULL (patient survives).
--    App-side guards additionally refuse deleting a healthcare professional
--    who authored medical records (FR-12 forbids losing authorship context);
--    deactivation is offered for those cases instead.
--
-- Applied via Dashboard → SQL Editor, like the earlier migrations.
-- ============================================================================

create table if not exists public.role_permissions (
  role public.user_role not null,
  permission text not null,
  primary key (role, permission)
);

alter table public.role_permissions enable row level security;

-- Every signed-in staff member can evaluate capabilities server-side.
create policy "rp_select_staff" on public.role_permissions for select
  using (auth.role() = 'authenticated');

-- Administrators manage the grant set.
create policy "rp_admin_all" on public.role_permissions for all
  using (auth_role() = 'administrator')
  with check (auth_role() = 'administrator');

-- Defaults mirroring current behaviour exactly (UC-03 starts from status quo).
insert into public.role_permissions (role, permission) values
  ('receptionist',            'patients.create'),
  ('administrator',           'patients.create'),
  ('receptionist',            'patients.edit'),
  ('healthcare_professional', 'patients.edit'),
  ('administrator',           'patients.edit'),
  ('healthcare_professional', 'records.add'),
  ('receptionist',            'appointments.schedule'),
  ('administrator',           'appointments.schedule'),
  ('administrator',           'reports.generate'),
  ('administrator',           'staff.manage')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- FK relaxations for FR-01 account deletion (see header rationale)
-- ---------------------------------------------------------------------------
alter table public.audit_logs
  drop constraint audit_logs_user_id_fkey,
  add constraint audit_logs_user_id_fkey
    foreign key (user_id) references public.profiles(id)
    on delete set null;

alter table public.patients
  drop constraint patients_registered_by_fkey,
  add constraint patients_registered_by_fkey
    foreign key (registered_by) references public.profiles(id)
    on delete set null;