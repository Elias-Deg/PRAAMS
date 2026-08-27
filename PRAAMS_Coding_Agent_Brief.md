---

You are the lead full-stack engineer building **PRAAMS** (Patient Record and Appointment Management System) — a real Senior Project (BSc Computer Science) codebase for a private clinic in Addis Ababa, based on an approved Requirements Analysis and Specification Document. Treat the requirements below as a contract, not a suggestion. Where something is ambiguous, make the most conservative, simplest choice that satisfies the stated requirement, state the assumption in your response, and move on — don't stall on it.

## 1. What this system is

A centralized, role-based web application that replaces a private clinic's paper-based patient records and phone/notebook-based appointment scheduling. Three staff roles use it: **Receptionist**, **Healthcare Professional**, and **Administrator**. Patients are never direct users of the system — they interact with staff, not the app.

## 2. Hard scope boundaries — do not build these

This is intentionally a focused system. Do **not** add, scaffold, or suggest:
- Pharmacy or medication management
- Laboratory / diagnostic management
- Billing, payments, or insurance claims
- Inventory or medical supply management
- Inpatient / admission / bed management
- Telemedicine or video consultation
- A native mobile app (web only, responsive down to tablet width — phone support is a nice-to-have, not a requirement)
- Any AI/chatbot features
- Multi-clinic / multi-tenant support (single clinic instance)

If you think one of these would "round out" the system, don't — flag it as a future idea instead of building it.

## 3. Required tech stack

- **Frontend:** Next.js (App Router), TypeScript (`strict: true`, no `any` without a comment justifying it), Tailwind CSS
- **Backend/DB:** Supabase — Postgres, Supabase Auth (email + password), Row Level Security for all access control. Do **not** hand-roll authentication, session handling, or password hashing — Supabase Auth already satisfies NFR-03.
- **Validation:** Zod schemas shared between client forms and server-side checks
- Use Server Components by default; only mark a component Client (`"use client"`) when it needs interactivity, browser APIs, or state
- No other backend framework, no separate Express/Node API layer — use Next.js route handlers / server actions talking directly to Supabase

## 4. Data model

Implement this schema exactly (as a Supabase migration file). This maps directly to the approved object model — don't rename fields or restructure without calling it out first.

```sql
-- Enums
create type user_role as enum ('receptionist', 'healthcare_professional', 'administrator');
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

-- Staff accounts (profile row created alongside each Supabase auth.users row)
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
```

### Row Level Security — starter policies

Enable RLS on every table above. Use this as your baseline, then adjust if a requirement needs it — but never leave a table without RLS enabled, and never rely on client-side role checks alone to protect data.

```sql
alter table profiles enable row level security;
alter table patients enable row level security;
alter table medical_records enable row level security;
alter table appointments enable row level security;
alter table audit_logs enable row level security;

create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

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
```

Every insert/update/delete on `patients`, `medical_records`, and `appointments` must also write a row to `audit_logs` (action, target_entity, target_id, user_id) — this satisfies FR-12 and NFR-10. Do this server-side (route handler / server action), not trusted to the client.

## 5. Functional requirements (must all be satisfied)

**User Management & Access Control**
- FR-01: Administrator can create, update, deactivate, and delete staff accounts (Receptionist, Healthcare Professional, Administrator roles)
- FR-02: Users authenticate via email + password
- FR-03: A user can only access functions/data available to their role
- FR-04: Administrator can configure/manage role permissions
- FR-05: Session auto-terminates after a period of inactivity

**Patient Record Management**
- FR-06: Receptionist registers a new patient (demographic + contact info)
- FR-07: System checks for potential duplicate patients during registration (match on name + phone + DOB; flag, don't block)
- FR-08: Authorized users can update existing patient info
- FR-09: Authorized users can search/retrieve patients by name, ID, or phone
- FR-10: Healthcare Professional can add medical record entries to a patient's file
- FR-11: Healthcare Professional can view a patient's full medical history
- FR-12: Permanent, non-editable audit log of changes to a patient's medical record

**Appointment Scheduling & Reporting**
- FR-13: Receptionist schedules an appointment for a patient with an available healthcare professional
- FR-14: System shows available time slots per healthcare professional
- FR-15: System prevents double-booking the same slot
- FR-16: Receptionist can reschedule or cancel an appointment
- FR-17: Receptionist and Healthcare Professional can view a calendar of appointments
- FR-18: Administrator can generate reports (registrations, appointment stats, staff activity) over a date range
- FR-19: Reports can be viewed on-screen, printed, or exported (PDF/CSV)

## 6. Non-functional requirements → concrete implementation directives

| ID | Requirement | What to actually do |
|---|---|---|
| NFR-01 | Patient record loads in <3s | Index the columns above; paginate list views; avoid `select *` on large joins |
| NFR-02 | Data encrypted in transit/at rest | Default on Supabase; don't disable SSL; never log full request bodies containing patient data |
| NFR-03 | Passwords never stored/logged in plaintext | Use Supabase Auth exclusively; never add a custom `password` column anywhere |
| NFR-04 | 99% availability | Infra/hosting concern (Supabase + Vercel), not something to build in code — don't over-engineer custom failover |
| NFR-05 | Usable with minimal training | Plain-language labels, inline validation errors, confirm dialogs before destructive actions (cancel appointment, deactivate staff) |
| NFR-06 | No data loss on crash/network blip | Persist to Supabase immediately on submit; don't hold unsaved critical data only in client memory; show a clear saved/error state |
| NFR-07 | Modular, maintainable | Feature-folder structure (see §8), no god-components, colocate types with their feature |
| NFR-08 | Scales with growth | Pagination everywhere lists can grow (patients, appointments, audit logs); indexed queries |
| NFR-09 | Ethiopian data protection compliance | Least-privilege RLS, no third-party analytics/trackers on pages with patient data, no PII in client-side error logging |
| NFR-10 | Audit trail of key actions | `audit_logs` table wired into every mutating action, see §4 |

## 7. Use cases → routes

Build one route per use case group. Every route must enforce its role restriction server-side (via RLS + a server-side role check), not just hide UI elements client-side.

| Route | Use Case(s) | Roles |
|---|---|---|
| `/login` | UC-01 Login | All |
| `/dashboard` | — role-specific landing page | All |
| `/admin/staff` | UC-02 Manage Staff Accounts | Administrator |
| `/admin/permissions` | UC-03 Configure Role-Based Access Permissions | Administrator |
| `/patients/new` | UC-04 Register New Patient | Receptionist |
| `/patients/[id]` | UC-05 Update Info, UC-06 view record, UC-08 View Medical History | Receptionist, Healthcare Professional, Administrator (view) |
| `/patients/[id]/edit` | UC-05 Update Patient Demographic Information | Receptionist, Healthcare Professional |
| `/patients` (search) | UC-06 Search / Retrieve Patient Record | Receptionist, Healthcare Professional, Administrator |
| `/patients/[id]/records/new` | UC-07 Add Medical Record Entry | Healthcare Professional |
| `/appointments` | UC-11 View Appointment Calendar | Receptionist, Healthcare Professional |
| `/appointments/new` | UC-09 Schedule Appointment | Receptionist |
| `/appointments/[id]` | UC-10 Reschedule / Cancel Appointment | Receptionist |
| `/admin/reports` | UC-12 Generate Administrative Report | Administrator |

Implement each use case's basic course of action **and** its alternative flows (e.g., UC-04's duplicate-check flag, UC-09's slot-taken race condition, UC-01's account lockout after 5 failed attempts). Alternative flows are not optional polish — they're part of the spec.

## 8. Project structure

```
/app
  /login
  /dashboard
  /admin/staff, /admin/permissions, /admin/reports
  /patients/... 
  /appointments/...
/components        -- shared, reusable UI only; feature-specific components live next to their route
/lib
  /supabase         -- client + server Supabase client factories
  /validation        -- Zod schemas
  /audit.ts          -- shared helper to write audit_log rows
/types              -- shared TS types generated from / matching the schema
/supabase/migrations -- SQL migration files
/supabase/seed.sql   -- seed data, see §10
```

## 9. Design direction (read this before writing any UI)

This is internal operational software used by busy clinic staff, not a marketing site — don't reach for the generic "AI app" look. Specifically avoid: cream background + terracotta accent, near-black background with a neon accent, or a hairline-rule broadsheet layout — those are current AI-generated defaults, not deliberate choices for this brief.

Direction to follow instead:
- **Color:** deep navy (`#1F3864`) as the primary/header color, a clean neutral gray scale for surfaces and text, and distinct, desaturated semantic colors for appointment status (scheduled / completed / cancelled / no-show) and role badges — reuse this palette so it stays consistent with the project's existing documentation.
- **Type:** one clean, highly legible sans-serif for everything (UI text and data both) — this is a data-dense tool used quickly between patients, not a place for display typography. Prioritize legibility and a clear size/weight scale over personality.
- **Layout:** persistent role-aware navigation, generous spacing in forms (this is used by people who are not necessarily comfortable with computers — NFR-05), clear empty states ("No appointments today" with a next action, not a blank table).
- Respect `prefers-reduced-motion`, keep all interactive elements keyboard-accessible with visible focus states, and keep the UI responsive down to a tablet viewport at minimum.
- The low-fidelity wireframes from the SRS document (login, registration, search, booking) establish the *content and layout*, not the final visual style — build a properly designed, polished version of them, not a literal recreation of the boxy mock-up look.

## 10. Seed data

Seed the database with demo data using the same sample identities already used in the SRS documentation, so screenshots taken from this build stay consistent with the submitted document:

- Patients: "Abebe Kebede" (ID pattern like `P-0231`), "Selam Tesfaye" (`P-0198`, female, DOB 1990-03-12)
- A healthcare professional named "Dr. Kassa"
- A couple of medical record entries for Selam Tesfaye dated around July and May 2026 (follow-up / initial consultation)
- One of each role's staff account for local testing (receptionist, healthcare professional, administrator)

## 11. Build order

Work through these phases one at a time. Stop after each and wait for confirmation before continuing.

1. **Phase 0 — Foundation:** Next.js + TS + Tailwind scaffold, Supabase project wiring, run the schema migration + RLS policies, seed script.
2. **Phase 1 — Auth:** Login page, session handling, role-aware redirect to `/dashboard`, account lockout after 5 failed attempts (UC-01).
3. **Phase 2 — User Management:** Admin staff CRUD, role/permission configuration (UC-02, UC-03).
4. **Phase 3 — Patient Records:** Register, search, view, update, medical history, add medical entry (UC-04 through UC-08).
5. **Phase 4 — Appointments:** Schedule, reschedule/cancel, calendar view, slot-conflict handling (UC-09 through UC-11).
6. **Phase 5 — Reporting:** Admin report generation with export (UC-12).
7. **Phase 6 — Hardening:** Confirm every mutating action writes an audit log, confirm every route's RLS actually blocks the wrong role (test this, don't assume it), responsive/accessibility pass, empty and error states everywhere.

## 12. Definition of done

Before calling any phase complete, verify against this checklist — don't just assert it's done, actually check:
- [ ] Every functional requirement in §5 relevant to this phase is implemented, including alternative flows
- [ ] Every table touched has RLS enabled and policy-tested for all three roles (try accessing as the wrong role and confirm it's denied)
- [ ] Every create/update/delete on patients, medical_records, appointments writes an audit_log row
- [ ] No password, session token, or full patient record appears in a client-side console.log
- [ ] Forms validate with Zod on both client and server
- [ ] Lists that can grow (patients, appointments, reports, audit logs) are paginated
- [ ] Loading, empty, and error states exist for every data-fetching view

If you're ever unsure whether something is in scope, check it against §2 and §5 before building it.
