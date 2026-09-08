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
 */
export function Topbar({
  fullName,
  role,
}: {
  fullName: string;
  role: UserRole;
}): React.ReactElement {
  const pathname = usePathname();
  const title = pathname === "/dashboard" ? "Dashboard" : null;

  return (
    <header className="hidden items-center justify-between gap-6 px-10 pb-1 pt-8 lg:flex print:hidden">
      {title ? (
        <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
      ) : (
        <span aria-hidden />
      )}

      <div className="flex items-center gap-5">
        <form action="/patients" role="search" className="relative w-72">
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

        <div className="flex items-center gap-3">
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