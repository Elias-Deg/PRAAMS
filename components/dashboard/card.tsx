import Link from "next/link";

import { Icon, type IconName } from "@/components/icons";
import type { AppointmentStatus } from "@/types/database";

/** Status palette shared by the split bar, legend dots and timeline chips. */
export const STATUS_BAR: Record<AppointmentStatus, string> = {
  completed: "bg-[#6cc4a1]",
  scheduled: "bg-[#8fb4ea]",
  cancelled: "bg-[#d98d8a]",
  no_show: "bg-[#d9b877]",
};

export const STATUS_DOT: Record<AppointmentStatus, string> = {
  completed: "bg-status-completed",
  scheduled: "bg-status-scheduled",
  cancelled: "bg-status-cancelled",
  no_show: "bg-status-no-show",
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  completed: "Completed",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const STATUS_ORDER: AppointmentStatus[] = [
  "completed",
  "scheduled",
  "cancelled",
  "no_show",
];

export type StatusCounts = Record<AppointmentStatus, number>;

/**
 * Card chrome shared by every dashboard widget: Poppins title + an optional
 * chevron shortcut. Springs in on load (staggered via `delay`), lifts on
 * hover, and the chevron wiggles when the card is hovered.
 */
export function Card({
  title,
  href,
  delay = 0,
  children,
}: {
  title: string;
  href?: string;
  delay?: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="group animate-pop-in rounded-3xl bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-gray-900">{title}</h2>
        {href && (
          <Link
            href={href}
            aria-label={`Open ${title.toLowerCase()}`}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-navy-tint hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            <Icon name="chevron" className="h-4 w-4 group-hover:animate-wiggle" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Compact KPI tile: quiet label, Poppins number. */
export function StatTile({
  label,
  value,
  hint,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delay?: number;
}): React.ReactElement {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-pop-in rounded-3xl bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-pop"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * Real appointment-status distribution (replaces the earlier decorative map):
 * a segmented bar plus a legend with live counts and shares.
 */
export function StatusSplit({
  counts,
  delay = 0,
}: {
  counts: StatusCounts;
  delay?: number;
}): React.ReactElement {
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);
  const share = (s: AppointmentStatus): number =>
    total > 0 ? Math.round((counts[s] / total) * 100) : 0;

  return (
    <div style={{ animationDelay: `${delay}ms` }} className="animate-pop-in">
      <div
        role="img"
        aria-label={`Appointment status split: ${STATUS_ORDER.map(
          (s) => `${STATUS_LABEL[s]} ${share(s)} percent`,
        ).join(", ")}`}
        className="flex h-3 overflow-hidden rounded-full bg-surface"
      >
        {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <span
            key={s}
            aria-hidden
            className={STATUS_BAR[s]}
            style={{ width: `${(counts[s] / Math.max(1, total)) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[s]}`} />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
              {STATUS_LABEL[s]}
            </span>
            <span className="text-xs font-bold text-gray-900">{share(s)}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-400">
        {total} appointment{total === 1 ? "" : "s"} in the window
      </p>
    </div>
  );
}

/** Outcome row used by each role's "appointments overview" card. */
export function OutcomeRow({
  title,
  icon,
  pct,
  subtitle,
}: {
  title: string;
  icon: IconName;
  pct: number;
  subtitle: string;
}): React.ReactElement {
  return (
    <li className="flex items-center gap-4 rounded-full bg-surface px-4 py-3 transition-all duration-200 hover:bg-navy-tint hover:shadow-soft">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-pop">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="trend" className="h-4 w-4 text-gray-500" />
        <span className="font-display text-lg font-bold text-gray-900">{pct}%</span>
      </div>
    </li>
  );
}

/** Shared empty-state block for dashboard lists. */
export function EmptyNote({
  text,
  ctaLabel,
  ctaHref,
}: {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}): React.ReactElement {
  return (
    <div className="mt-3 rounded-2xl bg-surface p-6 text-center">
      <p className="text-sm text-gray-500">{text}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}