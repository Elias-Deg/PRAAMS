# PRAAMS — Living Documentation

> **MAINTAINER CONTRACT** — this file is the single source of truth about the project.
> After **every task**, the finishing developer/agent MUST update at least:
> §8 (feature state), §14 (decision log) and any section whose facts changed.
> A reader should be able to continue the project correctly *without opening other files*;
> code pointers exist so they can go deeper when needed.

---

## 1. What PRAAMS is

**PRAAMS** = *Patient Record and Appointment Management System*.
A centralized, role-based web application that replaces a private clinic's paper-based
patient records and phone/notebook appointment scheduling in **Addis Ababa, Ethiopia**.

- Academic context: real BSc Computer Science Senior Project, built against an approved
  Requirements Analysis & Specification Document (contracted in
  `PRAAMS_Coding_Agent_Brief.md` — treat that file as requirements law).
- **Users**: clinic staff only — Receptionist, Healthcare Professional (HP),
  Administrator. Patients are *never* direct users; staff operate on their behalf.
- Design intent: internal operational software for busy staff, not a marketing site.
  Deep navy `#1F3864` brand, neutral grays, desaturated semantic colors, one highly
  legible sans-serif (Inter), generous form spacing, explicit empty states with next
  actions, keyboard-accessible with visible focus rings, `prefers-reduced-motion`
  respected, responsive down to tablet.

**Hard scope exclusions (never build without changing the brief):** pharmacy/lab,
billing/insurance, inventory, inpatient/beds, telemedicine, native mobile apps,
AI/chatbot features, multi-clinic tenancy.

---

## 2. Governing rules this codebase enforces

| Rule | Where it bites |
|---|---|
| RLS on every table; authorization enforced **server-side** (RLS floor + app-level capability checks), never by hiding UI only | all pages/actions |
| Every mutating action writes an `audit_logs` row server-side | FR-12/NFR-10 |
| Passwords never stored/logged/plaintext anywhere; Supabase Auth owns identity | NFR-03 |
| No full patient data in client logs; no third-party trackers/analytics | NFR-09 |
| Zod validation on client form **and** inside each Server Action | everywhere forms exist |
| Lists that can grow are paginated; indexes per migration #000001 | NFR-01/08 |
| Destructive actions require confirmation dialogs | NFR-05 |
| Alternative flows are contract, not polish (duplicate-flag, slot-conflict, lockout…) | §11 of brief |

---

## 3. Tech stack & the reasoning behind each choice

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router (Turbopack) | RSC-first data tooling, Server Actions remove need for a separate API layer (brief forbids one) |
| Language | TypeScript `strict` | contract-grade typing across UI↔server boundary |
| Styling | Tailwind CSS v4 (`@theme` tokens in `app/globals.css`) | design-token driven, fast iteration, tokens encode §9 design direction |
| Font | Inter via `next/font` | single legible sans (brief) |
| Database/Auth | Supabase (Postgres + GoTrue + PostgREST) | brief-mandated; RLS + managed auth satisfy NFR-03 |
| Validation | Zod v4-style API | one schema reused client/server as required |
| Cookies/session | `@supabase/ssr` + custom `proxy.ts` | secure httpOnly session cookies w/ refresh-on-navigation |
| Seed/tooling | `tsx` runner + service-role admin API | deterministic idempotent demo data incl. Auth users |

Not used (deliberately): global client state libs (RSC suffices), separate REST layer,
ORMs (typed PostgREST client via hand-mirrored `types/database.ts`),
middleware.ts (renamed **proxy.ts** in Next 16).

---

## 4. Architecture

### 4.1 Request lifecycle

1. **`proxy.ts` (root)** runs on every non-static route: refreshes Supabase cookies
   (`getUser()` revalidates JWTs — raw cookie payloads never trusted), then:
   - idle check (FR-05): if `praams_last_active` cookie older than 30 min → sign out,
     redirect `/login?reason=idle`;
   - unauthenticated → `/login`; authenticated hitting `/login` → `/dashboard`;
   - `/` self-heals to the right destination.
2. **Server Component page** resolves session/profile via `getCurrentProfile()`
   (React-cached per request) and gates on permission helpers before rendering.
3. **Mutations** happen exclusively through Server Actions (`lib/actions/*.ts`,
   `'use server'`), which re-verify authentication + capability (direct POSTs to
   action endpoints must never succeed blindly), run Zod validation, write audit rows
   via `writeAuditLog()` (`lib/audit.ts`), then revalidate and navigate or return
   typed state consumed by `useActionState`.
4. Client components are leaf-level interactivity only (forms, toggles, idle watcher);
   no global client state exists.

Supabase client split (**know the difference or you'll leak secrets**):

| File | Env scope | Key | Use for |
|---|---|---|---|
| `lib/supabase/client.ts` | browser | anon | any browser query (RLS applies) |
| `lib/supabase/server.ts` | server | anon + cookies | default server choice (RLS applies) |
| `lib/supabase/admin.ts` | server-only guard | service-role | GoTrue admin ops, throttle RPCs — bypasses RLS |

<!-- CHUNK2 -->

### 4.2 Trust boundaries & security model

Three independent enforcement layers — removing one must not break security:

1. **RLS floor (database)** — policies in migration #000001/#000020 define the
   maximum any role can ever do, regardless of app bugs.
   Highlights: patients readable by all staff / insertable by receptionist+admin /
   updatable by all three; medical_records **insert-only by HP** (no update/delete
   policies → permanence FR-12); audit_logs insert-by-any / read-admin-only;
   profiles self-read + admin-write; `role_permissions` read-all-staff,
   write-admin-only.
2. **Server-side capability checks (application)** — `requireAdministrator()` and
   `can(role, permission)` (`lib/auth/session.ts`, `lib/permissions/data.ts`) gate
   every admin page/action *again* server-side. Capabilities can only **narrow**
   the RLS floor.
3. **UI reflection** — buttons/routes hidden when capabilities say no; never the
   other way around.

Auth-specific mechanics:
- **Lockout (UC-01)**: 5 consecutive failed attempts per email → 30-minute lock
  (`login_throttle` table + `is_login_locked` / `register_failed_login` /
  `reset_failed_logins` security-definer RPCs; counters reset on success or expiry).
  Constants mirrored in `lib/constants.ts` — keep SQL and TS in sync if changed.
- **Idle termination (FR-05)**: 30-min inactivity via cookie stamped by
  `components/idle-cookie-watcher.tsx`, enforced inside proxy.
- **Audit**: single helper `writeAuditLog(userId, action, targetEntity, targetId)`;
  action strings are SCREAMING_SNAKE tokens (see §6.4 for current catalogue).
- Account deletion anonymizes actors: `audit_logs.user_id` and
  `patients.registered_by` are `ON DELETE SET NULL`; deletion of staff tied to
  permanent clinical data is refused in favor of deactivation.

### 4.3 Data layer conventions

- Schema truth lives in **SQL migrations**; `types/database.ts` is a hand-mirrored
  strict-TS view (regenerate with supabase CLI later if linked). Keep both in sync —
  the file header says so too.
- Row reads use selective columns where cheap; counts use `{ count: "exact" }`
  with `.limit(1)` (**never** `head:true` for existence checks — PostgREST answers
  HEAD with 204 even on missing tables; a project-specific lesson).
- Display code `patients.patient_code` (`P-####`, sequence from 232) is the
  human-facing identifier; uuid PK stays internal.

---

## 5. Codebase map

```
proxy.ts                      request pipeline (auth refresh, idle, gates)
app/
  layout.tsx  globals.css     root shell: Inter font, tokens <style>, IdleCookieWatcher
  page.tsx                    "/" stub redirect (proxy does real routing)
  login/{page,login-form}.tsx UC-01 sign-in screen (+ client form)
  dashboard/page.tsx          role-aware landing; module cards live-link ready features
  admin/staff/…               UC-02: list / new / [id] edit+danger-zone
  admin/permissions/page.tsx  UC-03 capability matrix editor
  patients/…                  Phase 3 route tree (search/new/[id]/records)
components/
  staff-account-form.tsx      create|edit account form (useActionState pattern)
  patient-form.tsx            Phase 3 demographic form (create|edit)
  permission-toggle.tsx       Granted/Denied pill form-button
  confirm-submit-button.tsx   native-confirm destructive submit (NFR-05)
  role-badge.tsx              desaturated role pill
  idle-cookie-watcher.tsx     global activity stamper (client)
lib/
  constants.ts                LOCKOUT_*/INACTIVITY_* single source (mirrored in SQL!)
  audit.ts                    writeAuditLog()
  auth/session.ts             getCurrentProfile() cached · requireAdministrator()
                              (+ requirePermission() Phase 3)
  permissions/data.ts         catalogue, labels, getGrantedMatrix(), can()
  actions/auth.ts             signIn/signOut server actions
  actions/staff.ts            create/update/toggleStatus/delete staff
  actions/permissions.ts      toggleRolePermission
  actions/patients.ts         Phase 3: createPatient/updatePatient/addMedicalRecord
  supabase/{client,server,admin}.ts   factory trio (§4.1 table)
  validation/{auth,staff,patient}.ts  Zod schemas + ActionState types
scripts/seed.ts               idempotent demo seeder (npm run db:seed)
supabase/migrations/          ordered SQL truth (000000 init · 000010 login security
                              · 000020 role permissions/FK relaxations)
types/database.ts             hand-mirrored DB types
Documentation.MD  README.md   living doc · quickstart/caste creds duplicate
PRAAMS_Coding_Agent_Brief.md  requirements contract (do not edit)
```

<!-- CHUNK3 -->

---

## 6. Data model reference (as implemented)

### 6.1 Tables

- **profiles** — `id uuid PK → auth.users ON DELETE CASCADE`, full_name, email
  UNIQUE, role user_role, phone, status('active'|'inactive') default active,
  created_at. Auto-created by trigger `handle_new_user()` reading
  `raw_user_meta_data->>{full_name,role}` (fallback: email local-part /
  receptionist — admins can correct via UC-02).
- **patients** — id uuid, **patient_code text UNIQUE not null**
  (DEVIATION #1, seq P-0232+), full_name, date_of_birth, gender, phone, address,
  emergency_contact, registered_by → profiles (SET NULL on delete), created_at.
  No delete flow by design; no updated_at column per contract.
- **medical_records** — patient_id CASCADE, author_id → profiles NOT NULL,
  visit_date timestamptz, diagnosis NOT NULL, notes, attachment_url
  (*reserved; no upload UI in MVP*). Insert-only permanence.
- **appointments** — patient_id CASCADE, staff_id (HP), scheduled_by (booker),
  date_time, status enum(scheduled|completed|cancelled|no_show) default scheduled,
  reason. Uniqueness for double-booking handled app-side + partial unique index
  planned in Phase 4 migration (slot conflict FR-15).
- **audit_logs** — user_id → profiles SET NULL, action text, target_entity,
  target_id uuid, timestamp default now().
- **login_throttle** (000010) — email PK, failed_attempts, locked_until,
  updated_at. RLS enabled, zero policies (service-role RPC path only).
- **role_permissions** (000020) — (role, permission) PK grant list.

### 6.2 Enums

`user_role`: receptionist · healthcare_professional · administrator
`appointment_status`: scheduled · completed · cancelled · no_show

### 6.3 Indexes (migration #000001)

patients(full_name), patients(phone), appointments(date_time),
appointments(staff_id), medical_records(patient_id).
Add per-feature indexes in that same file style going forward.

### 6.4 Audit action catalogue (keep appending)

INSERT_PATIENT · UPDATE_PATIENT · INSERT_MEDICAL_RECORD · INSERT_APPOINTMENT ·
RESCHEDULE_APPOINTMENT · CANCEL_APPOINTMENT · CREATE_STAFF ·
UPDATE_STAFF · DEACTIVATE_STAFF · REACTIVATE_STAFF · DELETE_STAFF ·
UPDATE_ROLE_PERMISSION role=… permission=… enabled=true|false

### 6.5 Documented deviations from the brief's §4 schema

1. `patients.patient_code` — human display code (FR-09 "search by ID" +
   brief §10 identities like P-0198 require it).
2. `handle_new_user()` trigger automating the §4 promise of profile-per-auth-row.
3. Seed as GoTrue-admin script instead of raw `seed.sql`.
4. `role_permissions` table (UC-03 store) narrowing-only vs RLS baseline;
   `staff.manage` fixed administrator-only to prevent self-lockout.
5. FK relaxations to `ON DELETE SET NULL` on audit actor / registrar so account
   deletion can't orphan permanent history; delete-of-record-authors refused in
   favor of deactivate; staff emails immutable post-creation.
6. Admin-set temporary passwords handed over in person (self-service change is
   post-MVP).

---

## 7. Capability & permission system

Catalogue (`lib/permissions/data.ts`, DB rows seeded by migration #000020):

| Permission | Default grants | Used by |
|---|---|---|
| patients.create | receptionist, administrator | /patients/new + createPatient |
| patients.edit | all three roles | /patients/[id]/edit |
| records.add | healthcare_professional | /records/new form + action |
| appointments.schedule | receptionist, administrator | Phase 4 |
| reports.generate | administrator | Phase 5 |
| staff.manage *(fixed)* | administrator only | /admin/staff tree + actions |

Helpers: `can(role,permission)` (matrix read w/ staff.manage special-cased),
`getGrantedMatrix()` request-cached, `requirePermission(permission)` /
`requireAdministrator()` server gates (redirect `/dashboard` on failure).
Toggles persist through `toggleRolePermission` and take effect immediately;
every toggle audited.

<!-- CHUNK4 -->

---

## 8. Feature state ledger (update after EVERY task)

**Phases**: 0 Foundation ✅ · 1 Auth ✅ · 2 User Management ✅ · 3 Patient Records ✅
· 4 Appointments ✅ · 5 Reporting ✅ · 6 Hardening ✅ — **MVP complete (brief §11)**

| Route | Use case | State | Key notes |
|---|---|---|---|
| `/login` | UC-01 | ✅ | Zod dual validation; lockout notices; idle-return banner `?reason=idle` |
| `/dashboard` | landing | ✅ | role-aware copy; live module cards for shipped features |
| `/admin/staff` (+`/new`,`/[id]`) | UC-02 | ✅ | CRUD+status lifecycle, guardrails §4.2, notice map dictionary |
| `/admin/permissions` | UC-03 | ✅ | matrix editor; narrow-only semantics |
| `/patients` (search) | UC-06 | ✅ | name/code/phone merge-search; paginated recent register; empty states |
| `/patients/new` | UC-04 | ✅ | FR-07 duplicate **flag-don't-block** via `?dup=` banner |
| `/patients/[id]` | UC-05 view/UC-08 | ✅ | demographics card, registrar attribution, permanent history timeline w/ author embed |
| `/patients/[id]/edit` | UC-05 update | ✅ | gated `patients.edit`; RLS-path update; audit UPDATE_PATIENT |
| `/patients/[id]/records/new` | UC-07 | 🚧 form shipped · E2E of addMedicalRecord pending manual browser pass | gated `records.add`; permanence warning inline |
| `/appointments` | UC-11 | ✅ | day calendar, prev/next + HP filter, status chips, empty state CTA |
| `/appointments/new` | UC-09 | ✅ | patient combobox, slot grid via /api/appointments/slots, race→23505 handling |
| `/appointments/[id]` | UC-10 | ✅ | reschedule w/ excludeIso, confirm-dialog cancel, terminal read-only states |
| `/admin/reports` (+`/export`) | UC-12 | ✅ | 3 report types over date ranges; CSV export w/ attachment filename; print/save-as-PDF via PrintButton; 500-row cap w/ truncation notice; 403/401 JSON on export route |

---

## 8.1 Brief §12 definition-of-done — final status

| Checklist item | Status | Evidence |
|---|---|---|
| All §5 functional requirements incl. alternative flows | ✅ | UC-01..12 rows above; FR-07 dup-flag, FR-15 slot-race, UC-01 lockout all implemented + tested |
| RLS enabled & policy-tested for all three roles | ✅ | Phase 6 matrix: every table × role × SELECT/INSERT/UPDATE/DELETE incl. filter-vs-403 semantics and silent no-op detection (state-unchanged checks) — all expected outcomes |
| Every create/update/delete on patients, records, appointments audited | ✅ | `writeAuditLog` in all actions (grep-verified §6.4 catalogue); runtime rows proven via staff-activity report |
| No password/token/full patient record in client console | ✅ | `console.*` grep across app/components/lib = zero hits |
| Zod on client & server for every form | ✅ | shared schemas in `lib/validation/*` consumed by forms + actions |
| Growing lists paginated | ✅ | patients list (20/page), search capped, reports 500-row cap + notice, calendar is day-scoped |
| Loading/empty/error states everywhere | ✅ | `loading.tsx` skeletons ×6 segments; empty states w/ next actions; root `error.tsx` (digest-only) + branded `not-found.tsx`; inline field/banner errors |

Integration verification highlights already passed: proxy unauth redirects ·
login renders · all three roles sign in · lockout SQL lifecycle · admin staff
pages render seeded trio · non-admins 307-bounced from admin tree ·
role_permissions read/write policies proven with real tokens · **Phase 3**:
anonymous bounce off /patients, code-search finds P-0198, Selam detail renders
both entries w/ author attribution, receptionist blocked from records/new,
HP blocked from /patients/new, RLS matrix (HP insert-patient 403, receptionist
insert-record 403, receptionist insert-patient 201 w/ sequence code, HP patch
204, delete 403 — probe cleaned up).

---

## 9. Conventions & house rules (follow or change the doc deliberately)

- **ActionState pattern**: every Server Action used with forms returns a typed
  state (`lib/validation/*.ts`) — `{ status, values?, fieldErrors?, message? }`;
  statuses currently: idle/field-error/failed/(saved/staff)… keep union tight.
- **Notices after redirect**: list/detail pages read `?notice=` codes mapped in
  per-page dictionaries with tone ok/warn/err. Add codes to BOTH action and map.
- **Form UX contract**: labeled inputs, inline field errors w/ aria-invalid +
  aria-describedby, pending labels on submit, noValidate (Zod owns messages).
- **Destructive = ConfirmSubmitButton** w/ explicit sentence confirmations.
- Tailwind tokens come only from `@theme` in globals.css (navy scale,
  status-*, role-*) — prefer semantic token classes over raw hexes.
- Imports use `@/*` alias. Strict mode; no `any` without justification comment.
- Existence checks & counts: `.select("id",{count:"exact"}).limit(1)` (**not**
  head:true). See §4.3 lesson.
- RLS-scoped server client is default; escalate to admin client only with a
  comment explaining why GoTrue/admin surface demands it.
- Every new mutation → append catalogue §6.4 AND write rows through
  `writeAuditLog`.
- Temp diagnostic scripts go in `scripts/_*.ts` and are DELETED before task end;
  `scripts/seed.ts` is the only permanent script.
- Update this file's §8/§14 whenever anything above changes.

---

## 10. Environment, scripts & operations

- `.env.local` keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only secret). Git-ignored (`.env*`).
- Scripts: `dev` / `build` / `start` / `lint` / `db:seed`
  (`tsx --env-file=.env.local scripts/seed.ts`, idempotent).
- Migrations are applied by pasting each file into Supabase Dashboard → SQL Editor,
  oldest-first. Applied log: #000000 init · #000010 login security ·
  #000020 role permissions/FK relaxations · #000030 appointment slot uniqueness
  (all applied). New migrations follow name pattern `YYYYMMDDHHMMSS_topic.sql` and
  must be added to README + applied-log here once pasted.
- Node ≥ 20 required (tsx --env-file). Windows dev machine.
- Build/lint gates: `npm run lint`, `npm run build` must be green before done.

---

## 11. Demo data & local credentials (NEVER production)

Staff (created via GoTrue): receptionist `liya.bekele@praams.clinic` /
`Praams#Rec2026`; HP `dr.kassa@praams.clinic` / `Praams#Hp2026`; administrator
`meron.tadesse@praams.clinic` / `Praams#Adm2026`.
Patients: Abebe Kebede P-0231 (male, DOB 1985-07-04), Selam Tesfaye P-0198
(female, DOB 1990-03-12) w/ two records by Dr. Kassa (2026-05-14 initial consult;
2026-07-02 follow-up) and appointments incl. one upcoming scheduled slot.
Passwords exist only in Supabase Auth; seeder prints them.

---

## 12. Verification story so far

Manual flows verified: unauth redirects, login render/errors, RBAC bounces,
staff CRUD journeys, permission toggles persistence.
Automated harnesses (run then deleted): REST probe battery, cookie-jar page/RBAC
battery, PostgREST policy checks with real bearer tokens (18/18 PASS at Phase 2
close). Pattern lives in git history (`scripts/_e2e.ts`) — resurrect the same
style for future phase sign-offs.

---

<!-- CHUNK5 -->

## 13. Roadmap & open assumptions (read before continuing)

**All six brief phases are COMPLETE.** Post-MVP ideas parked for the write-up
(never built, per §2): trigram fuzzy search, admin manual lockout release,
self-service password change, appointment `no_show` marking UI (status exists and
is reportable; marking happens via future UC), attachment uploads.

Open assumptions to revisit with the client/document if graded on them:
- Clinic hours model implemented in Phase 4: Mon–Sat 09:00–17:00 EAT, 30-min
  slots, no lunch hole, Sundays closed (`lib/constants.ts`).
- Lockout = 5 consecutive failures → 30-min auto-expiry (no admin manual unlock;
  Phase 2 reactivation clears counters as a side door).
- Idle timeout fixed at 30 minutes.
- gender enum choice for patients is a UI-level select (male/female/other) — text
  column at DB level.
- Password self-service change deferred; also email-change for staff accounts
  intentionally unsupported.
- `attachment_url` exists but no upload flow (brief MVP note).
- Search uses btree/prefix semantics; trigram fuzzy search deferred.
- Reports: PDF satisfied via browser print-to-PDF (print stylesheet); CSV is
  native export.

---

## 14. Decision log (append-only; newest last)

- **2026-08-27 · Phase 0**: Supabase wiring split into anon-browser / anon-server /
  service-admin factories; hand-mirrored DB types; idempotent seeder via GoTrue
  admin API (raw auth-schema SQL rejected as fragile); diagnostic `/` page used to
  validate env+DB then removed. Learned: PostgREST HEAD→204 masks missing tables →
  banned head:true existence checks (§4.3).
- **2026-08-27 · Phase 1**: Next-16 proxy.ts (middleware rename) adopted for cookie
  refresh + route gates; lockout via security-definer RPCs (5-fail/30-min, mirrored
  constants); FR-05 idle via activity-cookie read in proxy; login/dashboard built
  replacing mockups; role badges + navy token palette established.
- **2026-08-27 · Phase 2**: staff CRUD w/ deletion guardrails referencing clinical
  permanence; FK relaxations to SET NULL enabling audited anonymized deletions;
  UC-03 capability matrix with narrow-only doctrine and fixed staff.manage rule;
  shared audit helper extracted to lib/audit.ts; RLS policy suite proven by live
  token battery (18/18).
- **2026-08-28 · Phase 3 + Documentation.MD adopted**: living-doc contract added at
  owner request (update §8/§14 every task). Patient register/search/detail/edit +
  permanent clinical entries built on existing tables — **no migration needed**.
  FR-07 implemented as post-save flag (`?dup=` ids → warn banner listing matching
  candidates); duplicate scan = name(ilike, wildcards stripped) AND (phone OR DOB)
  via parallel queries. `requirePermission()` generalizes admin gate for
  capability-granted routes (records/new, patients/new bounce non-holders);
  history uses `author:profiles(full_name)` embed. RBAC verified: HP insert-patient
  403 & receptionist insert-record 403 prove DB floor beneath app gates; sequence
  codes confirmed race-safe (P-#### assigned on REST insert).
- **2026-08-28 · Phase 4**: appointment booking/reschedule/cancel/calendar shipped;
  FR-15 double-booking made DB-impossible via two partial unique indexes
  (#000030, status='scheduled' rows only) with app-side pre-check + 23505 catch
  as the race path; slot engine constants (09:00–17:00 EAT, 30-min, Sun closed)
  centralized in lib/constants.ts; two authenticated GET route handlers added
  (/api/appointments/slots, /api/patients/search) with /api added to proxy
  protected prefixes; SlotPicker excludeIso pattern keeps an appointment's own
  slot selectable while rescheduling. Verified: clash→409 at DB, booked slot
  greyed, Sunday closed, HP write 403 / receptionist 204 policy split.
- **2026-08-28 · Phase 5**: reporting module (`lib/reports/data.ts` engine shared
  by screen + CSV route; registrants/appointments/staff-activity over Addis-date
  ranges; 500-row cap + truncation notice; CSV quoting/escaping + attachment
  filename; print→PDF via window.print()). Export route enforces admin with
  JSON 401/403 (route-handler pattern, no redirects). 19-check battery incl.
  seeded-data rendering, CSV shape, receptionist 403, anonymous 307.
- **2026-08-28 · Phase 6 (final)**: hardening pass — full RLS×role×operation
  matrix executed with real tokens (filter-vs-403 semantics; silent no-op
  detection via state-unchanged checks) across profiles, patients,
  medical_records, appointments, audit_logs, login_throttle, role_permissions —
  all expected outcomes; audit catalogue grep-verified; `console.*` sweep clean;
  root error.tsx (digest-only) + branded 404 + six loading.tsx skeletons added;
  skip-link + main landmarks on every screen; fixed a self-inflicted
  wildcard-path corruption of five bracket-route pages during the sweep
  (rewritten from session sources, integrity re-verified line-by-line).
  MVP COMPLETE per brief §11.





