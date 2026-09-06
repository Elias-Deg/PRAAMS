import { ADDIS_UTC_OFFSET, CLINIC_CLOSE_HOUR, CLINIC_OPEN_HOUR, CLINIC_SLOT_MINUTES, todayInAddis } from "@/lib/constants";

/** Start/end instants for one Addis calendar date. */
export function dayBounds(date: string): { gte: string; lte: string } {
  return {
    gte: `${date}T00:00:00${ADDIS_UTC_OFFSET}`,
    lte: `${date}T23:59:59${ADDIS_UTC_OFFSET}`,
  };
}

/** Groups any instant under its Addis calendar date (YYYY-MM-DD). */
export function addisDateKey(iso: string): string {
  return new Date(Date.parse(iso) + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** n calendar dates ending today (Addis), oldest first. */
export function lastNDayKeys(n: number): string[] {
  const today = todayInAddis();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.parse(`${today}T00:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/** "just now" · "5m ago" · "2h ago" · "3d ago" · date beyond that. */
export function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));
}

/** Monday of the week containing the given Addis calendar date. */
export function mondayOf(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return new Date(d.getTime() - shift * 86_400_000).toISOString().slice(0, 10);
}

/** The clinic's slot start labels ("09:00" … "16:30"), independent of date. */
export function slotLabels(): string[] {
  const out: string[] = [];
  for (let m = CLINIC_OPEN_HOUR * 60; m <= CLINIC_CLOSE_HOUR * 60 - CLINIC_SLOT_MINUTES; m += CLINIC_SLOT_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Addis wall-clock "HH:mm" for a stored instant. */
export function addisTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(iso));
}