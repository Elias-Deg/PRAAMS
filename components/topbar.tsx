"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  receptionist: "Receptionist",
  healthcare_professional: "Healthcare Professional",
  administrator: "Administrator",
};

/**
 * Content-area top bar of the dashboard-v2 shell: section title (dashboard
 * only — other pages render their own headers), real patient search that hits
 * the register's `q` param, an appointments shortcut with a live-ish dot, and
 * the signed-in user chip. Client-side so the title tracks the pathname.
 * Responsive: sticky and compact on mobile (search + identity), full on lg+.
 */
export function Topbar({
  fullName,
  role,
  patientCount,
}: {
  fullName: string;
  role: UserRole;
  patientCount: number;
}): React.ReactElement {
  const pathname = usePathname();
  const title = pathname === "/dashboard" ? "Dashboard" : null;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-surface/85 px-4 py-3 backdrop-blur transition-colors lg:static lg:flex lg:items-center lg:justify-between lg:gap-6 lg:border-0 lg:bg-transparent lg:px-10 lg:pb-1 lg:pt-8 lg:backdrop-blur-none print:hidden">
      {title ? (
        <h1 className="hidden font-display text-2xl font-bold text-gray-900 lg:block">
          {title}
        </h1>
      ) : (
        <span aria-hidden className="hidden lg:block" />
      )}

      <div className="flex items-center gap-2 lg:gap-5">
        {/* Mobile identity — the sidebar hero is desktop-only */}
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <Avatar name={fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-gray-900">{fullName}</p>
            <p className="truncate text-[10px] text-gray-400">{ROLE_LABELS[role]}</p>
          </div>
        </div>

        <form action="/patients" role="search" className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            name="q"
            placeholder="Search patients"
            aria-label="Search patients"
            className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none"
          />
        </form>

        <Link
          href="/appointments"
          aria-label="Open appointments"
          title="Appointments"
          className="relative rounded-full p-1.5 text-gray-700 transition-colors hover:animate-wiggle hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <Icon name="bell" className="h-5 w-5" />
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
          />
        </Link>

        {/* Desktop: live patients count + name/role chip */}
        <span
          title="Registered patients"
          className="hidden items-center gap-1.5 rounded-full bg-navy-tint px-3 py-1.5 text-xs font-bold text-navy lg:inline-flex"
        >
          <Icon name="users" className="h-3.5 w-3.5" />
          {patientCount.toLocaleString("en-US")}
          <span className="sr-only">registered patients</span>
        </span>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="text-right leading-tight">
            <p className="text-sm font-bold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[role]}</p>
          </div>
          <Avatar name={fullName} size="md" />
        </div>
      </div>
    </header>
  );
}