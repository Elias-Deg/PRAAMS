# PRAAMS — Patient Record and Appointment Management System

Senior Project (BSc Computer Science) — a centralized, role-based web application that
replaces paper-based patient records and phone/notebook scheduling at a private clinic
in Addis Ababa. Staff roles: **Receptionist**, **Healthcare Professional**,
**Administrator**. Patients are never direct users.

Requirements are contracted in [`PRAAMS_Coding_Agent_Brief.md`](./PRAAMS_Coding_Agent_Brief.md).

## Tech stack

- Next.js (App Router) · TypeScript (`strict`) · Tailwind CSS v4
- Supabase — Postgres, Auth (email/password), Row Level Security everywhere
- Zod validation shared between client and server

## Setup

1. **Environment** — `.env.local` at the repo root contains:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server-only; bypasses RLS; never expose client-side
   ```

2. **Apply BOTH schema migrations** — open the
   [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/_/sql/new),
   paste **all of each file**, run them one at a time:

   - `supabase/migrations/20260827000000_init_praams.sql` — tables, indexes,
     `patient_code` display codes, RLS policies, auth→profiles trigger.
   - `supabase/migrations/20260827000010_login_security.sql` — UC-01 failed-login
     throttle (`login_throttle` + RPC functions).
   - `supabase/migrations/20260827000020_role_permissions.sql` — UC-03 capability
     grants (`role_permissions` + defaults) and FK relaxations that let FR-01
     delete accounts without orphaning audit history (actor anonymized).

3. **Seed demo data** (§10 identities):

   ```bash
   npm run db:seed
   ```

   Idempotent — safe to re-run. Prints the demo credentials when finished.

4. **Run locally**

   ```bash
   npm install
   npm run dev          # http://localhost:3000 shows the Phase 0 foundation check
   ```

### Demo accounts (local testing only)

| Role | Email | Password |
|---|---|---|
| Receptionist | `liya.bekele@praams.clinic` | `Praams#Rec2026` |
| Healthcare Professional | `dr.kassa@praams.clinic` | `Praams#Hp2026` |
| Administrator | `meron.tadesse@praams.clinic` | `Praams#Adm2026` |

Seeded patients: Abebe Kebede (`P-0231`) and Selam Tesfaye (`P-0198`, female,
DOB 1990-03-12), with medical entries dated 2026-05-14 (initial consultation) and
2026-07-02 (follow-up), authored by Dr. Kassa.

## Project structure

```
app/                   App Router routes (screens land here per phase)
lib/supabase/          client.ts (browser) · server.ts (RLS-scoped server) · admin.ts (service-role, server-only)
lib/validation/        Zod schemas (added Phase 1+)
types/database.ts      Hand-written DB types mirroring the migration
supabase/migrations/   SQL schema + RLS
scripts/seed.ts        Idempotent seed via GoTrue admin API (`npm run db:seed`)
```

## Build phases (§11)

- [x] **Phase 0 — Foundation:** scaffold, Supabase wiring, migration + RLS, seed
- [x] **Phase 1 — Auth:** login, proxy session refresh/route gate, role dashboard,
      lockout after 5 failures (UC-01), idle-session termination (FR-05)
- [x] **Phase 2 — User Management:** staff CRUD with guardrails (UC-02),
      configurable role-permission matrix (UC-03), audited throughout
- [ ] Phase 3 — Patient Records (UC-04–08)
- [ ] Phase 4 — Appointments (UC-09–11)
- [ ] Phase 5 — Reporting (UC-12)
- [ ] Phase 6 — Hardening: audit coverage, RLS verification, a11y/responsive pass

## Documented deviations from the brief's schema contract

1. **`patients.patient_code`** (unique, sequence-generated, e.g. `P-0198`) — added
   because FR-09 requires lookup "by ID" and §10 seeds carry such codes, yet §4 had
   no column for it. It is an additional immutable label alongside the uuid PK.
2. **`handle_new_user()` trigger** — keeps §4's promise ("profile row created
   alongside each auth.users row") automatically instead of relying on each flow.
3. **Seed as a script, not `seed.sql`** — creating staff requires rows in
   `auth.users`; the supported path is the GoTrue admin API with the service-role
   key, which raw SQL seeding cannot use safely.
4. **`role_permissions` table** (migration 000020) backs UC-03: a (role,
   permission) grant list that can only *narrow* what RLS already permits,
   never widen it. `staff.manage` is a fixed administrator-only rule so the
   permissions screen can never lock itself out.
5. **Account deletion semantics** (FR-01): deleting is refused for staff who
   authored medical records or hold appointment links (FR-12 permanence) —
   deactivate instead; `audit_logs.user_id` / `patients.registered_by` were
   relaxed to `ON DELETE SET NULL` so audits survive with the actor anonymized;
   email addresses are immutable on existing accounts (they anchor sign-in).
6. **Staff emails** are created with admin-set temporary passwords handed over
   in person; self-service password change is out of MVP scope.
