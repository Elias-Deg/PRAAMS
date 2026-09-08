import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GroupedBars } from "@/components/grouped-bars";
import { Icon, type IconName } from "@/components/icons";
import { getCurrentProfile } from "@/lib/auth/session";
import { CLINIC_CLOSE_HOUR, CLINIC_OPEN_HOUR, todayInAddis } from "@/lib/constants";
import { addisDateKey, addisTimeLabel, dayBounds, lastNDayKeys } from "@/lib/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface OutcomeRow {
  title: string;
  icon: IconName;
  pct: number;
}

interface SessionRow {
  title: string;
  booked: number;
  on: boolean;
  done: boolean;
}

interface DayBar {
  label: string;
  booked: number;
  completed: number;
}

interface DashboardData {
  scopeLabel: string;
  outcomes: OutcomeRow[];
  sessions: SessionRow[];
  week: DayBar[];
  scheduledPct: number;
  completedPct: number;
  statusHref: string;
}

function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * Dashboard v2 (§14 reference design): outcome-rate rows, today's sessions
 * with in-progress toggles, a booked-vs-completed week chart and a status
 * split card — every number computed from live tables (role-scoped for HPs).
 */
export default async function DashboardPage(): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const today = todayInAddis();
  const day = dayBounds(today);
  const weekKeys = lastNDayKeys(7);
  const start30 = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const isHp = profile.role === "healthcare_professional";

  // Outcomes over the last 30 days (HP: own appointments only).
  const { data: rows30 } =
    isHp === true
      ? await supabase
          .from("appointments")
          .select("status, date_time")
          .eq("staff_id", profile.id)
          .gte("date_time", dayBounds(start30).gte)
          .lte("date_time", day.lte)
          .limit(2000)
      : await supabase
          .from("appointments")
          .select("status, date_time")
          .gte("date_time", dayBounds(start30).gte)
          .lte("date_time", day.lte)
          .limit(2000);
  const appt30 = (rows30 ?? []) as unknown as {
    status: AppointmentStatus;
    date_time: string;
  }[];
  const total30 = appt30.length;

  // Today's morning/afternoon split (Addis wall clock).
  const { data: rowsDay } =
    isHp === true
      ? await supabase
          .from("appointments")
          .select("date_time")
          .eq("staff_id", profile.id)
          .gte("date_time", day.gte)
          .lte("date_time", day.lte)
          .limit(500)
      : await supabase
          .from("appointments")
          .select("date_time")
          .gte("date_time", day.gte)
          .lte("date_time", day.lte)
          .limit(500);
  const apptDay = (rowsDay ?? []) as unknown as { date_time: string }[];
  const amCount = apptDay.filter(
    (r) => Number(addisTimeLabel(r.date_time).slice(0, 2)) < 12,
  ).length;

  // Last 7 days: booked vs completed per weekday.
  const { data: rowsWeek } =
    isHp === true
      ? await supabase
          .from("appointments")
          .select("status, date_time")
          .eq("staff_id", profile.id)
          .gte("date_time", dayBounds(weekKeys[0]).gte)
          .lte("date_time", day.lte)
          .limit(1000)
      : await supabase
          .from("appointments")
          .select("status, date_time")
          .gte("date_time", dayBounds(weekKeys[0]).gte)
          .lte("date_time", day.lte)
          .limit(1000);
  const apptWeek = (rowsWeek ?? []) as unknown as {
    status: AppointmentStatus;
    date_time: string;
  }[];

  const hourNow = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Africa/Addis_Ababa",
    }).format(new Date()),
  );

  const data: DashboardData = {
    scopeLabel: `Last 30 days · ${isHp ? "your schedule" : "all clinicians"}`,
    outcomes: [
      {
        title: "Visit completion",
        icon: "check",
        pct: pctOf(appt30.filter((r) => r.status === "completed").length, total30),
      },
      {
        title: "Cancellation rate",
        icon: "close",
        pct: pctOf(appt30.filter((r) => r.status === "cancelled").length, total30),
      },
      {
        title: "No-show rate",
        icon: "clock",
        pct: pctOf(appt30.filter((r) => r.status === "no_show").length, total30),
      },
    ],
    sessions: [
      {
        title: "Morning session",
        booked: amCount,
        on: hourNow >= CLINIC_OPEN_HOUR && hourNow < 12,
        done: hourNow >= 12,
      },
      {
        title: "Afternoon session",
        booked: apptDay.length - amCount,
        on: hourNow >= 12 && hourNow < CLINIC_CLOSE_HOUR,
        done: hourNow >= CLINIC_CLOSE_HOUR,
      },
    ],
    week: weekKeys.map((key) => {
      const rows = apptWeek.filter((r) => addisDateKey(r.date_time) === key);
      return {
        label: new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
          weekday: "short",
        }),
        booked: rows.length,
        completed: rows.filter((r) => r.status === "completed").length,
      };
    }),
    scheduledPct: pctOf(
      appt30.filter((r) => r.status === "scheduled").length,
      total30,
    ),
    completedPct: pctOf(
      appt30.filter((r) => r.status === "completed").length,
      total30,
    ),
    statusHref: profile.role === "administrator" ? "/admin/reports" : "/appointments",
  };

  return <DashboardView data={data} />;
}

/**
 * Card chrome shared by the four dashboard widgets: Poppins title + a
 * chevron shortcut into the section that owns the data.
 */
function Card({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-gray-900">{title}</h2>
        <Link
          href={href}
          aria-label={`Open ${title.toLowerCase()}`}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <Icon name="chevron" className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Decorative simplified world map (§14 reference card) — legend holds the data. */
function StatusMap(): React.ReactElement {
  return (
    <svg viewBox="0 0 360 190" aria-hidden className="h-auto w-full">
      <g fill="#e8ebf1">
        <path d="M18 38 L52 24 86 30 92 48 74 62 66 84 52 76 34 60 Z" />
        <path d="M78 96 L104 88 110 118 96 152 84 138 76 114 Z" />
        <path d="M158 34 L192 26 200 44 184 58 166 52 Z" />
        <path d="M162 66 L200 60 212 92 198 132 182 126 170 98 Z" />
        <path d="M206 24 L286 16 306 40 292 72 262 84 236 62 212 46 Z" />
        <path d="M292 118 L326 112 336 134 308 148 Z" />
      </g>
      <circle cx="70" cy="70" r="9" fill="#1f3864" opacity="0.18" />
      <circle cx="70" cy="70" r="4.5" fill="#1f3864" />
      <circle cx="298" cy="54" r="9" fill="#56ccf2" opacity="0.25" />
      <circle cx="298" cy="54" r="4.5" fill="#56ccf2" />
    </svg>
  );
}

function DashboardView({ data }: { data: DashboardData }): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="space-y-5">
          <Card title="Appointments overview" href="/appointments">
            <ul className="mt-1 list-none divide-y divide-gray-100 p-0">
              {data.outcomes.map((o) => (
                <li key={o.title} className="flex items-center gap-4 py-4 first:pt-3 last:pb-0">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-pop">
                    <Icon name={o.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-900">{o.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{data.scopeLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="trend" className="h-4 w-4 text-gray-500" />
                    <span className="font-display text-lg font-bold text-gray-900">
                      {o.pct}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Weekly appointments" href="/appointments">
            <div className="mt-4">
              <GroupedBars
                data={data.week}
                ariaLabel="Appointments per day over the last 7 days"
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
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card title="Today's sessions" href="/appointments">
            <ul className="mt-1 list-none divide-y divide-gray-100 p-0">
              {data.sessions.map((s) => (
                <li key={s.title} className="flex items-center gap-4 py-4 first:pt-3 last:pb-0">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-pop">
                    <Icon name="calendar" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-900">{s.title}</p>
                    <p className="mt-0.5 text-sm font-semibold text-status-completed">
                      + {s.booked} booked
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      aria-hidden
                      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                        s.on ? "bg-accent" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          s.on ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </span>
                    <span className="text-xs italic text-gray-400">
                      {s.on ? "On progress" : s.done ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="By status" href={data.statusHref}>
            <div className="mt-2">
              <StatusMap />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-navy" />
                {data.scheduledPct}% Scheduled
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent-light" />
                {data.completedPct}% Completed
              </span>
            </div>
            <p className="sr-only">
              Shares of appointments by status over the last 30 days.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
