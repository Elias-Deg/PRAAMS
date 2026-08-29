import { ADDIS_UTC_OFFSET } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/database";

/**
 * UC-12 · FR-18 — report engine shared by the on-screen page and the CSV
 * exporter. Every report is a date-range query with a row cap (NFR-01/08:
 * lists that can grow must be bounded) and a normalised tabular shape.
 */

export const REPORT_TYPES = ["registrations", "appointments", "staff-activity"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  registrations: "Patient registrations",
  appointments: "Appointment statistics",
  "staff-activity": "Staff activity (audit trail)",
};

export interface ReportParams {
  type: ReportType;
  from: string; // YYYY-MM-DD (Addis calendar)
  to: string;
}

export interface ReportResult {
  title: string;
  columns: string[];
  rows: string[][];
  summary: { label: string; value: string }[];
  truncated: boolean;
}

const ROW_CAP = 500;

function rangeBounds(from: string, to: string): { gte: string; lte: string } {
  return {
    gte: `${from}T00:00:00${ADDIS_UTC_OFFSET}`,
    lte: `${to}T23:59:59${ADDIS_UTC_OFFSET}`,
  };
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeStyle: "short" });

export function isReportType(value: string | undefined): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value ?? "");
}

export function validRange(from: string, to: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;
}

// --- buildReport ---

export async function buildReport(params: ReportParams): Promise<ReportResult> {
  const supabase = await createSupabaseServerClient();
  const { gte, lte } = rangeBounds(params.from, params.to);

  if (params.type === "registrations") {
    const { data, count } = await supabase
      .from("patients")
      .select("patient_code, full_name, date_of_birth, gender, phone, created_at, registrar:profiles(full_name)", { count: "exact" })
      .gte("created_at", gte)
      .lte("created_at", lte)
      .order("created_at", { ascending: false })
      .limit(ROW_CAP);

    const rows = (data ?? []) as unknown as {
      patient_code: string; full_name: string; date_of_birth: string;
      gender: string; phone: string | null; created_at: string;
      registrar: { full_name: string } | null;
    }[];

    return {
      title: REPORT_LABELS.registrations,
      columns: ["Code", "Full name", "Date of birth", "Gender", "Phone", "Registered at", "Registered by"],
      rows: rows.map((r) => [
        r.patient_code,
        r.full_name,
        dateFmt.format(new Date(r.date_of_birth)),
        r.gender.charAt(0).toUpperCase() + r.gender.slice(1),
        r.phone ?? "—",
        dateFmt.format(new Date(r.created_at)),
        r.registrar?.full_name ?? "—",
      ]),
      summary: [{ label: "Total registrations", value: String(count ?? rows.length) }],
      truncated: (count ?? 0) > ROW_CAP,
    };
  }

  if (params.type === "appointments") {
    const { data, count } = await supabase
      .from("appointments")
      .select("date_time, status, reason, patient:patients(full_name, patient_code), hp:profiles!appointments_staff_id_fkey(full_name)", { count: "exact" })
      .gte("date_time", gte)
      .lte("date_time", lte)
      .order("date_time", { ascending: false })
      .limit(ROW_CAP);

    const rows = (data ?? []) as unknown as {
      date_time: string; status: AppointmentStatus; reason: string | null;
      patient: { full_name: string; patient_code: string } | null;
      hp: { full_name: string } | null;
    }[];

    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      title: REPORT_LABELS.appointments,
      columns: ["Date", "Time", "Patient", "Code", "Professional", "Status", "Reason"],
      rows: rows.map((r) => [
        dateFmt.format(new Date(r.date_time)),
        timeFmt.format(new Date(r.date_time)),
        r.patient?.full_name ?? "—",
        r.patient?.patient_code ?? "—",
        r.hp?.full_name ?? "—",
        r.status === "no_show" ? "No-show" : r.status.charAt(0).toUpperCase() + r.status.slice(1),
        r.reason ?? "—",
      ]),
      summary: [
        { label: "Total appointments", value: String(count ?? rows.length) },
        { label: "Scheduled", value: String(byStatus.scheduled ?? 0) },
        { label: "Completed", value: String(byStatus.completed ?? 0) },
        { label: "Cancelled", value: String(byStatus.cancelled ?? 0) },
        { label: "No-shows", value: String(byStatus.no_show ?? 0) },
      ],
      truncated: (count ?? 0) > ROW_CAP,
    };
  }

  // staff-activity
  const { data, count } = await supabase
    .from("audit_logs")
    .select("timestamp, action, target_entity, target_id, actor:profiles(full_name)", { count: "exact" })
    .gte("timestamp", gte)
    .lte("timestamp", lte)
    .order("timestamp", { ascending: false })
    .limit(ROW_CAP);

  const rows = (data ?? []) as unknown as {
    timestamp: string; action: string; target_entity: string | null;
    target_id: string | null; actor: { full_name: string } | null;
  }[];

  const byStaff = rows.reduce<Record<string, number>>((acc, r) => {
    const name = r.actor?.full_name ?? "—";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return {
    title: REPORT_LABELS["staff-activity"],
    columns: ["Timestamp", "Staff", "Action", "Target entity", "Target id"],
    rows: rows.map((r) => [
      new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(r.timestamp)),
      r.actor?.full_name ?? "(deleted account)",
      r.action,
      r.target_entity ?? "—",
      r.target_id ?? "—",
    ]),
    summary: [
      { label: "Total events in range", value: String(count ?? rows.length) },
      ...Object.entries(byStaff)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, n]) => ({ label: `Events by ${name}`, value: String(n) })),
    ],
    truncated: (count ?? 0) > ROW_CAP,
  };
}

/** CSV serialisation with proper quoting/escaping (FR-19). */
export function toCsv(columns: string[], rows: string[][]): string {
  const cell = (value: string): string =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [columns.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
}
