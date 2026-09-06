"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/icons";
import type { UserRole } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  "receptionist",
  "healthcare_professional",
  "administrator",
];

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ALL_ROLES },
  { href: "/patients", label: "Patients", icon: "users", roles: ALL_ROLES },
  { href: "/appointments", label: "Appointments", icon: "calendar", roles: ALL_ROLES },
  { href: "/admin/staff", label: "Staff", icon: "userCog", roles: ["administrator"] },
  { href: "/admin/permissions", label: "Permissions", icon: "shield", roles: ["administrator"] },
  { href: "/admin/reports", label: "Reports", icon: "chart", roles: ["administrator"] },
];

/**
 * Sidebar navigation (client so the active section tracks the real pathname —
 * drill-down pages like /patients/[id] keep their section highlighted).
 */
export function ShellNav({ role }: { role: UserRole }): React.ReactElement {
  const pathname = usePathname();

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ul className="flex list-none gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-0">
      {NAV.filter((item) => item.roles.includes(role)).map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className="shrink-0 lg:w-full">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98] lg:w-full ${
                active
                  ? "bg-white text-navy shadow-pop"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}