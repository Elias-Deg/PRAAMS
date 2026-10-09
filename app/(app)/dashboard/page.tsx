import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import type { StatusCounts } from "@/components/dashboard/card";
import { HpDashboard } from "@/components/dashboard/hp-dashboard";
import { ReceptionistDashboard } from "@/components/dashboard/receptionist-dashboard";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/permissions/data";
import { todayInAddis } from "@/lib/constants";
import {
  addisDateKey,
  addisTimeLabel,
  dayBounds,
  lastNDayKeys,
  mondayOf,
  relativeTime,
} from "@/lib/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface ApptRow {
  status: AppointmentStatus;
  date_time: string;
}

/** Human labels for audited actions (§6.4 catalogue). */
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

function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Live status counts for the split card. */
function countStatuses(rows: { status: AppointmentStatus }[]): StatusCounts {
  const counts: StatusCounts = { scheduled: 0, completed: 0, cancelled: 0, no_show: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

function outcomesOf(
  rows: ApptRow[],
): { title: string; icon: "check" | "close" | "clock"; pct: number }[] {
  const total = rows.length;
  return [
    {
      title: "Visit completion",
      icon: "check",
      pct: pctOf(rows.filter((r) => r.status === "completed").length, total),
    },
    {
      title: "Cancellation rate",
      icon: "close",
      pct: pctOf(rows.filter((r) => r.status === "cancelled").length, total),
    },
    {
      title: "No-show rate",
      icon: "clock",
      pct: pctOf(rows.filter((r) => r.status === "no_show").length, total),
    },
  ];
}

function weekBars(
  rows: ApptRow[],
  weekKeys: string[],
): { label: string; booked: number; completed: number }[] {
  return weekKeys.map((key) => {
    const dayRows = rows.filter((r) => addisDateKey(r.date_time) === key);
    return {
      label: new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "short",
        timeZone: "UTC",
      }),
      booked: dayRows.length,
      completed: dayRows.filter((r) => r.status === "completed").length,
    };
  });
}

/**
 * Role-specific workspace (§14). Each role gets a genuinely different page:
 * administrators see clinic-wide throughput, staff load and the audit trail;
 * receptionists see today's front-desk flow and fresh registrations;
 * clinicians see their own day, load and documentation. Every number is a
 * live query — nothing on this page is static.
 */
export default async function DashboardPage(): Promise<React.ReactElement> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") redirect("/login");

  const supabase = await createSupabaseServerClient();
  const today = todayInAddis();
  const day = dayBounds(today);
  const weekKeys = lastNDayKeys(7);
  const start30 = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const isHp = profile.role === "healthcare_professional";

  /** Appointments in a day range — scoped to the clinician when HP. */
  const rowsFor = async (fromKey: string, toKey: string): Promise<ApptRow[]> => {
    const cols = "status, date_time";
    const from = dayBounds(fromKey).gte;
    const to = dayBounds(toKey).lte;
    const { data } =
      isHp === true
        ? await supabase
            .from("appointments")
            .select(cols)
            .eq("staff_id", profile.id)
            .gte("date_time", from)
            .lte("date_time", to)
            .order("date_time", { ascending: true })
            .limit(2000)
        : await supabase
            .from("appointments")
            .select(cols)
            .gte("date_time", from)
            .lte("date_time", to)
            .order("date_time", { ascending: true })
            .limit(2000);
    return (data ?? []) as unknown as ApptRow[];
  };

  const [appt30, apptWeek] = await Promise.all([
    rowsFor(start30, today),
    rowsFor(weekKeys[0], today),
  ]);
  const statusCounts = countStatuses(appt30);
  const week = weekBars(apptWeek, weekKeys);

  /* ---------------- ADMINISTRATOR: clinic-wide + staff + audit ------------- */
  if (profile.role === "administrator") {
    const [patientsC, todayC, staffC, auditC, dayRows, activityRows] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact" }).limit(1),
      supabase
        .from("appointments")
        .select("id", { count: "exact" })
        .gte("date_time", day.gte)
        .lte("date_time", day.lte)
        .limit(1),
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("status", "active")
        .limit(1),
      supabase
        .from("audit_logs")
        .select("id", { count: "exact" })
        .gte("timestamp", dayBounds(weekKeys[0]).gte)
        .limit(1),
      supabase
        .from("appointments")
        .select("staff_id, hp:profiles!appointments_staff_id_fkey(id, full_name)")
        .gte("date_time", day.gte)
        .lte("date_time", day.lte)
        .limit(500),
      supabase
        .from("audit_logs")
        .select("id, action, timestamp, actor:profiles(full_name)")
        .order("timestamp", { ascending: false })
        .limit(6),
    ]);

    const duty = new Map<string, { id: string; name: string; count: number }>();
    for (const row of (dayRows.data ?? []) as unknown as {
      hp: { id: string; full_name: string } | null;
    }[]) {
      if (!row.hp) continue;
      const entry = duty.get(row.hp.id) ?? {
        id: row.hp.id,
        name: row.hp.full_name,
        count: 0,
      };
      entry.count += 1;
      duty.set(row.hp.id, entry);
    }

    const activity = (
      (activityRows.data ?? []) as unknown as {
        id: string;
        action: string;
        timestamp: string;
        actor: { full_name: string } | null;
      }[]
    ).map((row) => ({
      id: row.id,
      text: ACTION_LABELS[row.action] ?? row.action,
      actor: row.actor?.full_name ?? "System",
      when: relativeTime(row.timestamp),
    }));

    return (
      <AdminDashboard
        patientsTotal={patientsC.count ?? 0}
        todayCount={todayC.count ?? 0}
        activeStaff={staffC.count ?? 0}
        audit7={auditC.count ?? 0}
        outcomes={outcomesOf(appt30)}
        week={week}
        statusCounts={statusCounts}
        staffOnDuty={Array.from(duty.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)}
        activity={activity}
      />
    );
  }
/* ------------- RECEPTIONIST: today's flow + fresh registrations ---------- */
  if (profile.role === "receptionist") {
    const next7End = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const week7Start = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const [dayRows, next7C, newC, newRows, patientsC] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, date_time, status, patient:patients(id, full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name)",
        )
        .gte("date_time", day.gte)
        .lte("date_time", day.lte)
        .order("date_time", { ascending: true })
        .limit(200),
      supabase
        .from("appointments")
        .select("id", { count: "exact" })
        .eq("status", "scheduled")
        .gte("date_time", day.gte)
        .lte("date_time", dayBounds(next7End).lte)
        .limit(1),
      supabase
        .from("patients")
        .select("id", { count: "exact" })
        .gte("created_at", dayBounds(week7Start).gte)
        .limit(1),
      supabase
        .from("patients")
        .select("id, full_name, patient_code, created_at")
        .gte("created_at", dayBounds(week7Start).gte)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("patients").select("id", { count: "exact" }).limit(1),
    ]);

    const dayList = ((dayRows.data ?? []) as unknown as {
      id: string;
      date_time: string;
      status: AppointmentStatus;
      patient: { id: string; full_name: string; patient_code: string } | null;
      hp: { full_name: string } | null;
    }[]).map((row) => ({
      id: row.id,
      time: addisTimeLabel(row.date_time),
      patient: row.patient?.full_name ?? "Unknown patient",
      patientId: row.patient?.id ?? "",
      code: row.patient?.patient_code ?? "—",
      clinician: row.hp?.full_name ?? "—",
      status: row.status,
    }));

    return (
      <ReceptionistDashboard
        todayCount={dayList.length}
        next7={next7C.count ?? 0}
        newThisWeek={newC.count ?? 0}
        patientsTotal={patientsC.count ?? 0}
        today={dayList.slice(0, 8)}
        newPatients={(
          (newRows.data ?? []) as unknown as {
            id: string;
            full_name: string;
            patient_code: string;
            created_at: string;
          }[]
        ).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          patient_code: p.patient_code,
          when: relativeTime(p.created_at),
        }))}
        statusCounts={statusCounts}
        mayRegister={await can(profile.role, "patients.create")}
      />
    );
  }

  /* ------------------- HEALTHCARE PROFESSIONAL: my own day ---------------- */
  const weekStartHp = mondayOf(today);
  const [myDayRows, seenC, entriesC] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, date_time, status, patient:patients(id, full_name, patient_code)")
      .eq("staff_id", profile.id)
      .gte("date_time", day.gte)
      .lte("date_time", day.lte)
      .order("date_time", { ascending: true })
      .limit(100),
    supabase
      .from("appointments")
      .select("id", { count: "exact" })
      .eq("staff_id", profile.id)
      .eq("status", "completed")
      .gte("date_time", dayBounds(weekStartHp).gte)
      .lte("date_time", day.lte)
      .limit(1),
    supabase
      .from("medical_records")
      .select("id", { count: "exact" })
      .eq("author_id", profile.id)
      .gte("visit_date", dayBounds(start30).gte)
      .limit(1),
  ]);

  const myDay = ((myDayRows.data ?? []) as unknown as {
    id: string;
    date_time: string;
    status: AppointmentStatus;
    patient: { id: string; full_name: string; patient_code: string } | null;
  }[]).map((row) => ({
    id: row.id,
    time: addisTimeLabel(row.date_time),
    patient: row.patient?.full_name ?? "Unknown patient",
    patientId: row.patient?.id ?? "",
    code: row.patient?.patient_code ?? "—",
    status: row.status,
  }));

  return (
    <HpDashboard
      todayCount={myDay.length}
      seenThisWeek={seenC.count ?? 0}
      entries30={entriesC.count ?? 0}
      completionPct={outcomesOf(appt30)[0].pct}
      today={myDay.slice(0, 8)}
      week={week}
      outcomes={outcomesOf(appt30)}
      statusCounts={statusCounts}
    />
  );
}