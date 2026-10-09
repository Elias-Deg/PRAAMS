# PRAAMS Audit Report — 2026-08-29 Read-Only Pass

> Read-only audit after theme unification, mock-data removal, role dashboards and mobile responsive batch. No code was changed in this pass.

## 0. Gates

- `npm run lint` — 0 errors
- `npm run build` — 0 errors, all 19 routes generated
- Mobile audit previously 14/14 PASS (smoke script removed per cleanup)

## 1. Executive Summary

PRAAMS is feature-complete for UC-01..12 / FR-01..19 on paper and structurally sound. Key strengths: RLS on every table, service-role isolation, Zod dual validation, audit trail on every mutating Server Action/Route Handler, DB-level double-booking prevention (two partial unique indexes), idle timeout + lockout. No mock/dummy/lorem arrays found; dashboards and reports are live queries. Mobile responsive fixes verified: sticky gutters, order swap, swipe hints, nav labels, toast placement.

**No Critical or High defects. 0 Critical, 0 High, 5 Medium, 4 Low.**

## 2. Priority 1 — Mock / Fake Hunt

**Sweep:** `TODO|FIXME|stub|mock|dummy|placeholder|temp|Lorem|hardcoded` across 99 files + manual scan for static arrays/counts/charts without Supabase query.

**Result: CLEAN.**

- No Lorem, no dummy arrays, no hardcoded people lists.
- Prior decorative world-map dots with fixed coordinates — removed, replaced by `StatusSplit` (segmented bar from live status counts, aria-described) and role-specific KPIs.
- Reports, dashboards, patient lists, calendars all backed by live queries (`supabase.from("patients").select`, `from("appointments")`, `from("medical_records")`, `from("audit_logs")`, etc.).
- Report engine (`lib/reports/data.ts`) builds rows from `count: exact` queries with 500-row cap (NFR-01/08) — not mocked.
- Benign hits: `placeholder` in input attributes / Tailwind `placeholder:text-gray-400` — not mock data.

## 3. FR / NFR / UC Coverage

### 3.1 FR Trace (live path verified)

| FR | Summary | Verdict | Evidence |
|---|---|---|---|
| FR-01 | Admin create/update/deactivate/delete staff | PASS | `lib/actions/staff.ts` createStaff/updateStaff/toggleStaffStatus/deleteStaff; guards: duplicate email, last-admin, self-delete, authored-records, linked-appointments; UI `app/(app)/admin/staff/*` |
| FR-02 | Email+password auth | PASS | `lib/actions/auth.ts` signIn via `supabase.auth.signInWithPassword`; Supabase Auth only |
| FR-03 | Role-restricted access | PASS | RLS + `requirePermission`/`requireAdministrator` on every page/action; nav filtered by role |
| FR-04 | Configure role permissions | PASS | `role_permissions` + `toggleRolePermission` (UC-03); narrow-only, `staff.manage` fixed admin-only |
| FR-05 | Auto-terminate idle session | PASS | `proxy.ts` checks `praams_last_active` vs 30m, signs out + `?reason=idle`; `IdleCookieWatcher` stamps cookie |
| FR-06 | Register patient | PASS | `createPatient` inserts `registered_by`, audit `INSERT_PATIENT` |
| FR-07 | Duplicate check flag-don't-block | PASS | Scans name+phone / name+DOB, collects dupIds, `?dup=` banner — not blocking |
| FR-08 | Update demographics | PASS | `updatePatient` RLS-path, audit `UPDATE_PATIENT` |
| FR-09 | Search by name/ID/phone | PASS | `patients/page.tsx` merges 3 queries (ilike name, phone, eq code); `app/api/patients/search` for combobox |
| FR-10 | Add medical entry | PASS | `addMedicalRecord` gated `records.add`, audit `INSERT_MEDICAL_RECORD` |
| FR-11 | View history chronological | PASS | `patients/[id]/page.tsx` selects ordered `visit_date desc` with author embed |
| FR-12 | Permanent audit log | PASS | No update/delete policy on `medical_records`; every mutation calls `writeAuditLog` via anon client |
| FR-13 | Schedule appointment | PASS | `scheduleAppointment` validates HP active, clash pre-check |
| FR-14 | Show available slots | PASS | `app/api/appointments/slots` returns 09:00-17:00 EAT minus booked+sundays; `SlotPicker` fetches per staff/date |
| FR-15 | Prevent double-booking | PASS | Partial unique indexes `(staff_id, date_time) where scheduled` + patient variant; 23505 catch |
| FR-16 | Reschedule/cancel | PASS | `rescheduleAppointment` exclude-self + `cancelAppointment` confirm dialog, both audited |
| FR-17 | Calendar view | PASS | `appointments/page.tsx` TimeGrid + MonthGrid, filters, now-line |
| FR-18 | Reports over date range | PASS | `lib/reports/data.ts` buildReport 3 types, gte/lte Addis bounds, 500 cap |
| FR-19 | View/print/export | PASS | On-screen table + `PrintButton` + CSV export route with attachment filename + quoting |
### 3.2 NFR Trace

| NFR | Verdict | Notes |
|---|---|---|
| NFR-01 <3s | PASS* | Indexes on patients(full_name, phone), appointments(date_time, staff_id), medical_records(patient_id); pagination 20/page, reports capped 500. *No DevTools timing with 100s rows in this pass — per test plan 7.3. |
| NFR-02 TLS/at-rest | PASS | Supabase default TLS; no full bodies logged; error.tsx shows digest only |
| NFR-03 passwords | PASS | Supabase Auth only; no password column; signIn never logs password |
| NFR-04 99% uptime | OUT OF SCOPE | Infra property per brief 5 |
| NFR-05 usability | PASS | Confirm dialogs, inline errors, empty states with CTA, generous spacing |
| NFR-06 no data loss | PASS | Persist on submit; no critical state only in memory |
| NFR-07 modular | PASS | Feature folders, colocated types, no god-components; lib/ui.ts tokens |
| NFR-08 scalability | PASS | Pagination + indexes + report cap |
| NFR-09 compliance | PASS | RLS least-privilege, no analytics/trackers, no PII in logs |
| NFR-10 audit trail | PASS | writeAuditLog throws on failure; called on every mutation |

### 3.3 UC Coverage

All UC-01..12 have routes: login, dashboard (role-split), admin/staff, permissions, patients list/new/detail/edit, records/new, appointments list/new/detail, reports+export. Only UC-07 E2E was flagged pending manual browser pass — code path exists and is gated.

## 4. RBAC — DB-Level Checks

**RLS enabled on every table:** profiles, patients, medical_records, appointments, audit_logs, login_throttle, role_permissions — all `enable row level security`.

**Policies (no `using (true)` leaks):**

- `profiles`: `profiles_self_or_admin_select` + `profiles_staff_read` (any authenticated read — approved deviation for FR-13/17) + `profiles_admin_write` (admin only)
- `patients`: select authenticated, insert receptionist+admin, update all staff. No delete — intentional.
- `medical_records`: select authenticated, insert HP only. No update/delete — permanence.
- `appointments`: select authenticated, write receptionist+admin (all)
- `audit_logs`: insert authenticated, select admin only (anon client, not service-role)
- `role_permissions`: select authenticated, all admin only
- `login_throttle`: zero policies — service-role RPC only

**App gates (narrow-only):** `requireAdministrator` and `requirePermission(can(role, perm))` redirect; `shell-nav.tsx` filters links by role but never relied on alone.

**Live proof still needed (12):** TC-14 expects receptionist -> GET /admin/reports denied + Studio audit_logs denied by RLS. Code shows 401/403 and redirects, but no live browser/Studio run in this pass — recommended before defense.

## 5. TC-01..TC-15 (read-only assessment)

> Actual Result columns were empty in the supplied Test Plan docx. This traces each TC to code/DB; full browser run still required.

| TC | Use Case | Observed in Code | Expected vs Observed |
|---|---|---|---|
| TC-01 | UC-01 valid login | /login -> signIn -> throttle reset -> active check -> /dashboard role-split | Matches |
| TC-02 | UC-01 invalid + lockout | is_login_locked -> signIn -> register_failed_login (5->30m lock) | Matches |
| TC-03 | UC-02 create staff + dup | duplicate email check before admin.createUser | Matches |
| TC-04 | UC-03 permissions | getGrantedMatrix + toggle upsert/delete + audit | Matches |
| TC-05 | UC-04 register + validation + dup | Zod both sides; blank->field-error; dup ilike name+phone/DOB -> ?dup banner | Matches |
| TC-06 | UC-05 update | RLS update + audit, gated patients.edit | Matches |
| TC-07 | UC-06 search | merge 3 queries, pagination .range(), empty state | Matches |
| TC-08 | UC-07 add entry | gated records.add, Zod, audit | Matches — E2E pending per docs |
| TC-09 | UC-08 history | ordered visit_date desc, author embed, count chip | Matches |
| TC-10 | UC-09 schedule + double-book | clash check + 23505 handling; SlotPicker booked greyed | Matches |
| TC-11 | UC-10 reschedule/cancel | exclude-self + terminal + confirm dialog | Matches |
| TC-12 | UC-11 calendar | TimeGrid/MonthGrid, filters, now-line | Matches |
| TC-13 | UC-12 reports export | buildReport + CSV route + empty-state | Matches |
| TC-14 | FR-03/NFR-10 unauthorized | proxy + page gates + RLS audit_logs admin-only | Matches in code — live Studio not run |
| TC-15 | FR-05 idle | proxy idle check + IdleCookieWatcher + ?reason=idle | Matches — 30m wait not run |
## 6. Visual Completeness

- Theme sweep 14: `lib/ui.ts` tokens across all forms, admin pages, slot-picker, combobox, skeleton, skip-link, 404/error — prior 20-check audit found zero old navy markers.
- Mobile batch 2: sticky time gutter, appointments order swap, shell-nav labels, avatar scaling, toast `inset-x-4`, swipe hints, hero scaling, login wave hiding.
- Loading/empty/error: `loading.tsx` in patients/appointments/dashboard/admin, `not-found.tsx`, `error.tsx` (digest-only), empty states with CTA.

## 7. Issue List (no code fixes in this pass)

### Critical — 0
### High — 0

### Medium — 5

| ID | Sev | Area | Description | File:Line |
|---|---|---|---|---|
| M-01 | Medium | RBAC live proof | TC-14/15 need live browser + Studio run. Code correct, not yet demonstrated. | `proxy.ts`, `app/(app)/admin/reports/page.tsx:26`, `app/(app)/admin/reports/export/route.ts:12-17` |
| M-02 | Medium | NFR-01 timing | No measured <3s with large dataset (7.3). Indexes/pagination present, no DevTools evidence. | `supabase/migrations/20260827000000_init_praams.sql:68-73` |
| M-03 | Medium | Appointments pagination | Calendar loads full date window without `.range()/.limit()` cap (bounded by window). | `app/(app)/appointments/page.tsx` |
| M-04 | Medium | Search sanitization | `app/api/patients/search` interpolates term into `.or()` — align sanitization (escape `*`/`"`). Low risk. | `app/api/patients/search/route.ts:16-27` |
| M-05 | Medium | UC-07 manual pass | Docs flag E2E addMedicalRecord pending browser pass. Form+action exist. | `app/(app)/patients/[id]/records/new/page.tsx` |

### Low — 4

| ID | Sev | Area | Description | File:Line |
|---|---|---|---|---|
| L-01 | Low | A11y | Verify `prefers-reduced-motion` disables animations (in globals.css — re-check). | `app/globals.css` |
| L-02 | Low | Observability | `writeAuditLog` throw -> 500 via error.tsx. Consider typed message. | `lib/audit.ts:28-29` |
| L-03 | Low | Seed | Future tomorrow seed — fine. | `scripts/seed.ts:257-280` |
| L-04 | Low | Docs | README Phase 6 checkbox truncated duplicate — cosmetic. | `README.md:98-99` |

## 8. Fix Order (when allowed)

1. M-01 — live TC-14/15 + record Actual Result
2. M-05 — HP adds record -> history + audit row
3. M-02 — seed large dataset + DevTools timing
4. M-03 — cap calendar query if load test shows growth
5. M-04 — align search sanitization

## 9. Files Audited (read)

`supabase/migrations/*.sql` (5), `proxy.ts`, `lib/audit|auth|constants|permissions|reports|actions|validation|supabase/*`, `types/database.ts`, `app/(app)/**/*.tsx`, `app/api/**/*`, `components/**`, `scripts/seed.ts`, `package.json`, `RAAMS_Requirements_Specification.md`, `PRAAMS_Coding_Agent_Brief.md`, `Documentation.MD`, `PRAAMS Test Plan.docx` (zip xml).

## 10. Conclusion

No mock data remains, no permissive RLS, no plaintext passwords, no data loss path. FR-01..19 and UC-01..12 satisfied structurally; remaining work is live proof (Actual Results, timing, idle demo) rather than code repair. **Lint 0 / Build 0 holds.**

---
*Generated read-only — only this report was written.*
