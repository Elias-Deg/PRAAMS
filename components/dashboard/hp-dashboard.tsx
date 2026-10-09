import Link from "next/link";

import {
  Card,
  EmptyNote,
  OutcomeRow,
  StatTile,
  STATUS_DOT,
  STATUS_LABEL,
  StatusSplit,
  type StatusCounts,
} from "@/components/dashboard/card";
import { GroupedBars } from "@/components/grouped-bars";
import { Icon, type IconName } from "@/components/icons";
import type { AppointmentStatus } from "@/types/database";

export interface HpTodayRow {
  id: string;
  time: string;
  patient: string;
  patientId: string;
  code: string;
  status: AppointmentStatus;
}

/**
 * Clinician workspace (§14): my day, my weekly load, my outcomes and my
 * documentation count — scoped to the signed-in professional only.
 */
export function HpDashboard({
  todayCount,
  seenThisWeek,
  entries30,
  completionPct,
  today,
  week,
  outcomes,
  statusCounts,
}: {
  todayCount: number;
  seenThisWeek: number;
  entries30: number;
  completionPct: number;
  today: HpTodayRow[];
  week: { label: string; booked: number; completed: number }[];
  outcomes: { title: string; icon: IconName; pct: number }[];
  statusCounts: StatusCounts;
}): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatTile label="My appointments today" value={todayCount} delay={0} />
        <StatTile label="Patients seen · this week" value={seenThisWeek} delay={80} />
        <StatTile label="Entries authored · 30 days" value={entries30} delay={160} />
        <StatTile label="My completion rate" value={`${completionPct}%`} delay={240} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card title="My day" href="/appointments" delay={0}>
            {today.length === 0 ? (
              <EmptyNote text="No appointments assigned to you today." />
            ) : (
              <ul className="mt-4 list-none space-y-2.5 p-0">
                {today.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/patients/${row.patientId}`}
                      className="group flex items-center gap-4 rounded-full bg-surface px-4 py-3 transition-all duration-200 hover:bg-navy-tint hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    >
                      <span className="font-display w-12 shrink-0 text-sm font-bold text-navy">
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
                          {STATUS_LABEL[row.status]}
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
            <p className="mt-3 text-xs text-gray-400">
              Open a patient to review history or add a clinical entry.
            </p>
          </Card>

          <Card title="My weekly appointments" href="/appointments" delay={120}>
            <div className="mt-4">
              <GroupedBars data={week} ariaLabel="My appointments per day over the last 7 days" />
            </div>
            <div className="mt-3 flex items-center gap-5 pl-7">
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent-light" />
                Booked
              </span>
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-navy" />
                Completed
              </span>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="My outcomes" href="/appointments" delay={60}>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {outcomes.map((o) => (
                <OutcomeRow
                  key={o.title}
                  title={o.title}
                  icon={o.icon}
                  pct={o.pct}
                  subtitle="Last 30 days · your appointments"
                />
              ))}
            </ul>
          </Card>

          <Card title="By status" delay={180}>
            <div className="mt-3">
              <StatusSplit counts={statusCounts} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}