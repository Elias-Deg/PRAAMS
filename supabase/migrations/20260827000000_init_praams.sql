-- ============================================================================
-- PRAAMS — Initial schema + RLS (Phase 0)
-- Data model taken from PRAAMS_Coding_Agent_Brief.md §4, applied verbatim.
-- Additions beyond the contract are explicitly marked with "-- DEVIATION:".
--
-- Run order: Supabase Dashboard → SQL Editor → paste entire file → Run.
-- ============================================================================

-- Enums ----------------------------------------------------------------------
create type user_role as enum ('receptionist', 'healthcare_professional', 'administrator');
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

-- Staff accounts (profile row created alongside each Supabase auth.users row --
-- see the handle_new_user() trigger at the bottom of this file) ---------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date not null,
  gender text not null,
  phone text,
  address text,
  emergency_contact text,
  registered_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  author_id uuid not null references profiles(id),
  visit_date timestamptz not null default now(),
  diagnosis text not null,
  notes text,
  attachment_url text, -- reserved for future use; no upload UI required for MVP
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  staff_id uuid not null references profiles(id),       -- the healthcare professional
  scheduled_by uuid not null references profiles(id),   -- the receptionist who booked it
  date_time timestamptz not null,
  status appointment_status not null default 'scheduled',
  reason text,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  target_entity text,
  target_id uuid,
  timestamp timestamptz not null default now()
);

-- Helpful indexes (NFR-01, NFR-08)
create index on patients (full_name);
create index on patients (phone);
create index on appointments (date_time);
create index on appointments (staff_id);
create index on medical_records (patient_id);

-- ============================================================================
-- DEVIATION: human-readable patient code (one flagged addition to §4)
--
-- Why: FR-09 requires patient lookup "by name, ID, or phone", and §10 seeds
-- identities carrying codes like `P-0231`, yet the §4 contract has no such
-- column. This adds the smallest possible field to satisfy both: a unique,
-- sequentially-generated display code. It does not replace the uuid PK — it
-- is an additional, immutable label shown in the UI. The Postgres sequence
-- guarantees race-safe uniqueness; its start value sits just above the
-- highest seeded code (P-0231) so new codes continue the same series.
-- ============================================================================
alter table patients add column patient_code text not null unique;
create sequence patient_code_seq start with 232 owned by patients.patient_code;
alter table patients
  alter column patient_code
  set default 'P-' || lpad(nextval('patient_code_seq')::text, 4, '0');

-- ============================================================================
-- Row Level Security — starter policies (§4 baseline)
-- ============================================================================
alter table profiles enable row level security;
alter table patients enable row level security;
alter table medical_records enable row level security;
alter table appointments enable row level security;
alter table audit_logs enable row level security;

create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable
set search_path = public; -- DEVIATION(hardening): pin search_path on SECURITY DEFINER fn

-- profiles
create policy "profiles_self_or_admin_select" on profiles for select
  using (id = auth.uid() or auth_role() = 'administrator');
create policy "profiles_admin_write" on profiles for all
  using (auth_role() = 'administrator');

-- patients: all authenticated staff can read; receptionist/admin create; broader staff can update
create policy "patients_select_staff" on patients for select
  using (auth.role() = 'authenticated');
create policy "patients_insert_receptionist" on patients for insert
  with check (auth_role() in ('receptionist', 'administrator'));
create policy "patients_update_staff" on patients for update
  using (auth_role() in ('receptionist', 'healthcare_professional', 'administrator'));
-- No delete policy on purpose: no use case deletes patient rows.

-- medical_records: readable by staff, insert-only by healthcare professionals (never editable — FR-12)
create policy "medrec_select_staff" on medical_records for select
  using (auth.role() = 'authenticated');
create policy "medrec_insert_hp" on medical_records for insert
  with check (auth_role() = 'healthcare_professional');
-- Deliberately no update/delete policy: entries are permanent once created.

-- appointments
create policy "appt_select_staff" on appointments for select
  using (auth.role() = 'authenticated');
create policy "appt_write_receptionist" on appointments for all
  using (auth_role() in ('receptionist', 'administrator'));

-- audit_logs: any authenticated action can write a log row; only admins can read them
create policy "audit_insert_all" on audit_logs for insert
  with check (auth.role() = 'authenticated');
create policy "audit_select_admin" on audit_logs for select
  using (auth_role() = 'administrator');

-- ============================================================================
-- Auto-create a profiles row whenever a new auth.users row appears.
-- Seeds name/role from raw_user_meta_data (the seed script sets these when
-- calling auth.admin.createUser). Falls back to email local-part and
-- 'receptionist' if metadata is absent; admins can correct afterwards (FR-01).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'receptionist')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
