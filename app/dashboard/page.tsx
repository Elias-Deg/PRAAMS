import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleBadge } from "@/components/role-badge";
import { signOut } from "@/lib/actions/auth";
import { getCurrentProfile } from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface ModuleCard {
  title: string;
  description: string;
  /** Placeholder modules point at their upcoming build phase. */
  phase?: number;
  /** Ready modules link directly into the app. */
  href?: string;
  ready?: boolean;
  roles?: UserRole[];
}

/** Route map placeholders — each becomes real in its phase (brief §7/§11). */
const MODULES: ModuleCard[] = [
  {
    title: "User management",
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
    title: "Patients",
    description: "Register, search and maintain patient demographic records.",
    phase: 3,
  },
  {
    title: "Medical records",
    description: "Add clinical entries and review a patient's full history.",
    phase: 3,
  },
  {
    title: "Appointments",
    description: "Book, reschedule and cancel visits; view the day's calendar.",
    phase: 4,
  },
  {
    title: "Reports",
    description: "Registrations, appointment statistics and staff activity exports.",
    phase: 5,
    roles: ["administrator"],
  },
];

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  // Proxy already gates this path; double-check here so direct renders are safe.
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      {/* Persistent app header */}
      <header className="flex h-14 shrink-0 items-center justify-between bg-navy px-6 shadow-sm">
        <span className="text-lg font-bold tracking-widest text-white">PRAAMS</span>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="hidden h-8 w-8 place-items-center rounded-full bg-navy-tint text-sm font-bold text-navy sm:grid"
          >
            {firstName(profile.full_name).slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden text-sm text-white md:inline">{profile.full_name}</span>
          <RoleBadge role={profile.role} />
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-white/80 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:text-white focus-visible:underline focus-visible:outline-none"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold text-navy">
          Welcome back, {firstName(profile.full_name)}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {profile.role === "receptionist" &&
            "Register patients, book appointments and keep records up to date."}
          {profile.role === "healthcare_professional" &&
            "Review patient history and add clinical entries during visits."}
          {profile.role === "administrator" &&
            "Manage staff accounts, permissions and clinic-wide reports."}
        </p>

        <h2 className="mt-10 mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
          Modules
        </h2>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.filter(
            (module) => !module.roles || module.roles.includes(profile.role),
          ).map((module) =>
            module.ready && module.href ? (
              <li
                key={module.title}
                className="flex flex-col rounded-md border border-navy/25 bg-white p-5 shadow-sm ring-1 ring-inset ring-navy/10"
              >
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
                  {module.description}
                </p>
                <Link
                  href={module.href}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm bg-navy px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  Open
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ) : (
              <li
                key={module.title}
                className="flex flex-col rounded-md border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
                  {module.description}
                </p>
                <p className="mt-4 inline-flex w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  Arrives in Phase {module.phase}
                </p>
              </li>
            ),
          )}
        </ul>

        <p className="mt-10 rounded-md border-l-4 border-status-completed bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          Authentication, sessions, account lockout and staff administration are active.
          This landing page grows into your daily workspace as each module ships.
        </p>
      </main>
    </div>
  );
}