import Link from "next/link";

import { Avatar } from "@/components/avatar";
import {
  Card,
  EmptyNote,
  StatTile,
  STATUS_DOT,
  STATUS_LABEL,
  StatusSplit,
  type StatusCounts,
} from "@/components/dashboard/card";
import { Icon } from "@/components/icons";
import type { AppointmentStatus } from "@/types/database";

export interface TodayRow {
  id: string;
  time: string;
  patient: string;
  patientId: string;
  code: string;
  clinician: string;
  status: AppointmentStatus;
}

/**
 * Reception workspace (§14): today's front-desk flow, next-week booking load
 * and the newest registrations — no clinic-wide analytics here.
 */
export function ReceptionistDashboard({
  todayCount,
  next7,
  newThisWeek,
  patientsTotal,
  today,
  newPatients,
  statusCounts,
  mayRegister,
}: {
  todayCount: number;
  next7: number;
  newThisWeek: number;
  patientsTotal: number;
  today: TodayRow[];
  newPatients: { id: string; full_name: string; patient_code: string; when: string }[];
  statusCounts: StatusCounts;
  mayRegister: boolean;
}): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatTile label="Appointments today" value={todayCount} delay={0} />
        <StatTile label="Booked · next 7 days" value={next7} delay={80} />
        <StatTile label="New registrations · 7 days" value={newThisWeek} delay={160} />
        <StatTile label="Patients on file" value={patientsTotal} delay={240} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card title="Today's schedule" href="/appointments" delay={0}>
            {today.length === 0 ? (
              <EmptyNote
                text="No appointments booked for today yet."
                ctaLabel="Book an appointment"
                ctaHref="/appointments/new"
              />
            ) : (
              <ul className="mt-4 list-none space-y-2.5 p-0">
                {today.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/appointments/${row.id}`}
                      className="group flex items-center gap-4 rounded-full bg-surface px-4 py-3 transition-all duration-200 hover:bg-navy-tint hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    >
                      <span className="w-12 shrink-0 font-display text-sm font-bold text-navy">
                        {row.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-bold text-gray-900">
                          <span className="truncate">{row.patient}</span>
                          <span className="shrink-0 rounded-full bg-navy-tint px-2 py-0.5 text-[10px] font-bold text-navy">
                            {row.code}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-400">
                          <span
                            aria-hidden
                            className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[row.status]}`}
                          />
                          {STATUS_LABEL[row.status]} · {row.clinician}
                        </p>
                      </div>
                      <Icon
                        name="chevron"
                        className="h-4 w-4 shrink-0 text-gray-400 group-hover:animate-wiggle group-hover:text-navy"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
<Card title="New registrations" href="/patients" delay={120}>
            {newPatients.length === 0 ? (
              <EmptyNote
                text="No patients registered in the last 7 days."
                ctaLabel={mayRegister ? "Register a patient" : undefined}
                ctaHref={mayRegister ? "/patients/new" : undefined}
              />
            ) : (
              <ul className="mt-3 list-none space-y-2 p-0">
                {newPatients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/patients/${p.id}`}
                      className="group flex items-center gap-3 rounded-full bg-surface px-3 py-2 transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    >
                      <Avatar name={p.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {p.full_name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {p.patient_code} · {p.when}
                        </p>
                      </div>
                      <Icon
                        name="chevron"
                        className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:animate-wiggle group-hover:text-navy"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
<div className="space-y-5">
          <Card title="Front-desk shortcuts" delay={60}>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {mayRegister && (
                <Link
                  href="/patients/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-[0.98]"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Register patient
                </Link>
              )}
              <Link
                href="/appointments/new"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-navy transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <Icon name="calendar" className="h-4 w-4" />
                Book appointment
              </Link>
              <Link
                href="/patients"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-navy transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <Icon name="search" className="h-4 w-4" />
                Find a patient
              </Link>
            </div>
          </Card>

          <Card title="By status" href="/appointments" delay={180}>
            <div className="mt-3">
              <StatusSplit counts={statusCounts} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}