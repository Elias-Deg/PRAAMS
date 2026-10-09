import Link from "next/link";

import { Avatar } from "@/components/avatar";
import {
  Card,
  EmptyNote,
  OutcomeRow,
  StatTile,
  StatusSplit,
  type StatusCounts,
} from "@/components/dashboard/card";
import { GroupedBars } from "@/components/grouped-bars";
import type { IconName } from "@/components/icons";

export interface AdminActivity {
  id: string;
  text: string;
  actor: string;
  when: string;
}

/**
 * Administrator workspace (§14): clinic-wide throughput, staff on duty and
 * the live audit trail — deliberately different from the reception and
 * clinician workspaces.
 */
export function AdminDashboard({
  patientsTotal,
  todayCount,
  activeStaff,
  audit7,
  outcomes,
  week,
  statusCounts,
  staffOnDuty,
  activity,
}: {
  patientsTotal: number;
  todayCount: number;
  activeStaff: number;
  audit7: number;
  outcomes: { title: string; icon: IconName; pct: number }[];
  week: { label: string; booked: number; completed: number }[];
  statusCounts: StatusCounts;
  staffOnDuty: { id: string; name: string; count: number }[];
  activity: AdminActivity[];
}): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatTile label="Registered patients" value={patientsTotal} delay={0} />
        <StatTile label="Appointments today" value={todayCount} delay={80} />
        <StatTile label="Active staff" value={activeStaff} delay={160} />
        <StatTile label="Audit events · 7 days" value={audit7} delay={240} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card title="Weekly appointments" href="/appointments" delay={0}>
            <div className="mt-4">
              <GroupedBars
                data={week}
                ariaLabel="Appointments per day over the last 7 days, clinic-wide"
              />
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

          <Card title="Recent activity" href="/admin/reports" delay={120}>
            {activity.length === 0 ? (
              <EmptyNote text="No audited activity yet." />
            ) : (
              <ul className="mt-3 list-none divide-y divide-gray-100 p-0">
                {activity.map((row) => (
                  <li key={row.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                    <span
                      aria-hidden
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{row.text}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {row.actor} · {row.when}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Appointments overview" href="/appointments" delay={60}>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {outcomes.map((o) => (
                <OutcomeRow
                  key={o.title}
                  title={o.title}
                  icon={o.icon}
                  pct={o.pct}
                  subtitle="Last 30 days · all clinicians"
                />
              ))}
            </ul>
          </Card>

          <Card title="Staff on duty today" href="/admin/staff" delay={180}>
            {staffOnDuty.length === 0 ? (
              <EmptyNote text="No clinician has appointments today." />
            ) : (
              <ul className="mt-3 list-none space-y-2 p-0">
                {staffOnDuty.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-full bg-surface px-3 py-2 transition-colors hover:bg-navy-tint"
                  >
                    <Avatar name={member.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">
                      {member.name}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-navy shadow-soft">
                      {member.count} today
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="By status" delay={300}>
            <div className="mt-3">
              <StatusSplit counts={statusCounts} />
            </div>
            <Link
              href="/admin/reports?type=appointments"
              className="mt-3 inline-block text-xs font-bold text-navy hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Open appointment report →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}