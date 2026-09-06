import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ActivityFeed, toneForAction, type FeedItem } from "@/components/activity-feed";
import { BarChart } from "@/components/bar-chart";
import { StatCard } from "@/components/stat-card";
import { getCurrentProfile } from "@/lib/auth/session";
import { todayInAddis } from "@/lib/constants";
import { addisDateKey, dayBounds, lastNDayKeys, relativeTime } from "@/lib/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface ModuleCard {
  title: string;
  description: string;
  phase?: number;
  href?: string;
  ready?: boolean;
  roles?: UserRole[];
}

/** Quick actions — compact links below the live workspace data. */
const MODULES: ModuleCard[] = [
  {
    title: "Patients",
    description: "Register, search and maintain patient demographic records.",
    href: "/patients",
    ready: true,
  },
  {
    title: "Appointments",
    description: "Book, reschedule and cancel visits; view the schedule.",
    href: "/appointments",
    ready: true,
  },
  {
    title: "Staff",
    description: "Create, edit, deactivate or remove staff accounts.",
    href: "/admin/staff",
    roles: ["administrator"],
    ready: true,
  },
  {
    title: "Permissions",
    description: "Configure which capabilities each role holds.",
    href: "/admin/permissions",
    roles: ["administrator"],
    ready: true,
  },
  {
    title: "Reports",
    description: "Registrations, appointment statistics and staff activity exports.",
    href: "/admin/reports",
    roles: ["administrator"],
    ready: true,
  },
];

const ACTION_LABELS: Record<string, string> = {
  INSERT_PATIENT: "New patient registered",
  UPDATE_PATIENT: "Patient details updated",
  INSERT_MEDICAL_RECORD: "Medical record added",
  INSERT_APPOINTMENT: "Appointment booked",
  RESCHEDULE_APPOINTMENT: "Appointment rescheduled",
  CANCEL_APPOINTMENT: "Appointment cancelled",
  CREATE_STAFF: "Staff account created",
  UPDATE_STAFF: "Staff account updated",
  DEACTIVATE_STAFF: "Staff deactivated",
  REACTIVATE_STAFF: "Staff reactivated",
  DELETE_STAFF: "Staff account deleted",
  UPDATE_ROLE_PERMISSION: "Role permissions changed",
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const today = todayInAddis();
  const weekKeys = lastNDayKeys(7);
  const day = dayBounds(today);
  const week = dayBounds(weekKeys[0]);

  let stats: { label: string; value: number }[] = [];
  let chartData: { label: string; value: number }[] | null = null;
  let feedItems: FeedItem[] | null = null;

  if (profile.role === "administrator") {
    const [patientsC, todayC, staffC, auditC] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact" }).limit(1),
      supabase.from("appointments").select("id", { count: "exact" }).gte("date_time", day.gte).lte("date_time", day.lte).limit(1),
      supabase.from("profiles").select("id", { count: "exact" }).eq("status", "active").limit(1),
      supabase.from("audit_logs").select("id", { count: "exact" }).gte("timestamp", week.gte).limit(1),
    ]);
    stats = [
      { label: "Total patients", value: patientsC.count ?? 0 },
      { label: "Appointments today", value: todayC.count ?? 0 },
      { label: "Active staff", value: staffC.count ?? 0 },
      { label: "Audit events · 7 days", value: auditC.count ?? 0 },
    ];

    // Chart: appointments per day, last 14 days (read-only, existing table).
    const days14 = lastNDayKeys(14);
    const { data: apptRows } = await supabase
      .from("appointments")
      .select("date_time")
      .gte("date_time", dayBounds(days14[0]).gte)
      .lte("date_time", day.lte)
      .limit(1000);
    const byDay = new Map(days14.map((d) => [d, 0]));
    for (const row of (apptRows ?? []) as { date_time: string }[]) {
      const key = addisDateKey(row.date_time);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    chartData = days14.map((d) => ({ label: d.slice(8), value: byDay.get(d) ?? 0 }));

    // Activity feed: last 8 audit rows, humanized, patient names resolved.
    const { data: audits } = await supabase
      .from("audit_logs")
      .select("id, action, target_entity, target_id, timestamp, actor:profiles(full_name)")
      .order("timestamp", { ascending: false })
      .limit(8);
    const auditRows = (audits ?? []) as unknown as {
      id: string; action: string; target_entity: string | null;
      target_id: string | null; timestamp: string;
      actor: { full_name: string } | null;
    }[];
    const patientTargets = auditRows
      .filter((a) => a.target_entity === "patients" && a.target_id)
      .map((a) => a.target_id as string);
    const nameMap = new Map<string, string>();
    if (patientTargets.length > 0) {
      const { data: named } = await supabase
        .from("patients")
        .select("id, full_name, patient_code")
        .in("id", patientTargets);
      for (const p of (named ?? []) as { id: string; full_name: string; patient_code: string }[]) {
        nameMap.set(p.id, `${p.full_name} (${p.patient_code})`);
      }
    }
    feedItems = auditRows.map((a) => {
      const base = ACTION_LABELS[a.action] ?? a.action;
      const target =
        a.target_entity === "patients" && a.target_id ? nameMap.get(a.target_id) : undefined;
      return {
        id: a.id,
        tone: toneForAction(a.action),
        text: `${base}${target ? ` — ${target}` : ""}`,
        meta: `by ${a.actor?.full_name ?? "system"} · ${relativeTime(a.timestamp)}`,
      };
    });
  }
  // --- HP / Receptionist stats ---
  if (profile.role === "healthcare_professional") {
    const [todayC, weekC, seen] = await Promise.all([
      supabase.from("appointments").select("id", { count: "exact" }).eq("staff_id", profile.id).gte("date_time", day.gte).lte("date_time", day.lte).limit(1),
      supabase.from("appointments").select("id", { count: "exact" }).eq("staff_id", profile.id).gte("date_time", week.gte).lte("date_time", day.lte).limit(1),
      supabase.from("appointments").select("patient_id").eq("staff_id", profile.id).gte("date_time", week.gte).lte("date_time", day.lte).limit(200),
    ]);
    const distinctPatients = new Set(
      ((seen.data ?? []) as { patient_id: string }[]).map((r) => r.patient_id),
    ).size;
    stats = [
      { label: "My appointments today", value: todayC.count ?? 0 },
      { label: "My appointments · 7 days", value: weekC.count ?? 0 },
      { label: "Patients seen this week", value: distinctPatients },
    ];
  } else if (profile.role === "receptionist") {
    const in7 = dayBounds(
      new Date(Date.parse(`${today}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10),
    );
    const [todayC, bookedC, patientsC, upcomingC] = await Promise.all([
      supabase.from("appointments").select("id", { count: "exact" }).gte("date_time", day.gte).lte("date_time", day.lte).limit(1),
      supabase.from("appointments").select("id", { count: "exact" }).gte("created_at", day.gte).lte("created_at", day.lte).limit(1),
      supabase.from("patients").select("id", { count: "exact" }).gte("created_at", week.gte).lte("created_at", day.lte).limit(1),
      supabase.from("appointments").select("id", { count: "exact" }).eq("status", "scheduled").gte("date_time", day.gte).lte("date_time", in7.lte).limit(1),
    ]);
    stats = [
      { label: "Appointments today", value: todayC.count ?? 0 },
      { label: "Booked today", value: bookedC.count ?? 0 },
      { label: "New patients · 7 days", value: patientsC.count ?? 0 },
      { label: "Scheduled · next 7 days", value: upcomingC.count ?? 0 },
    ];
  }

  const quick = MODULES.filter((m) => !m.roles || m.roles.includes(profile.role));

  return (
    <AppShell active="dashboard" profile={profile} width="wide">
      <h1 className="text-2xl font-bold text-navy">
        Welcome back, {firstName(profile.full_name)}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {profile.role === "receptionist" &&
          "Register patients, book appointments and keep records up to date."}
        {profile.role === "healthcare_professional" &&
          "Review patient history and add clinical entries during visits."}
        {profile.role === "administrator" &&
          "A live view of the clinic — patients, bookings and staff at a glance."}
      </p>

      {/* --- LIVE STATS --- */}
      <section aria-label="Key numbers" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      {/* --- ADMIN: CHART + ACTIVITY FEED --- */}
      {chartData && feedItems && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Appointments · last 14 days
            </h2>
            <div className="mt-4">
              <BarChart
                data={chartData}
                ariaLabel="Appointments per day over the last 14 days"
              />
            </div>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Recent activity
            </h2>
            <div className="mt-4">
              <ActivityFeed items={feedItems} />
            </div>
          </section>
        </div>
      )}

      {/* --- QUICK ACTIONS --- */}
      <h2 className="mt-10 mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
        Quick actions
      </h2>
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {quick.map((module) =>
          module.ready && module.href ? (
            <li key={module.title}>
              <Link
                href={module.href}
                className="group block rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-navy-light hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-[0.98]"
              >
                <p className="text-sm font-semibold text-gray-900">{module.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {module.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-navy group-hover:underline">
                  Open <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ) : (
            <li
              key={module.title}
              className="rounded-2xl border border-gray-100 bg-white/60 p-4"
            >
              <p className="text-sm font-semibold text-gray-400">{module.title}</p>
              <p className="mt-1 text-xs text-gray-400">
                Arrives in Phase {module.phase}
              </p>
            </li>
          ),
        )}
      </ul>
    </AppShell>
  );
}
