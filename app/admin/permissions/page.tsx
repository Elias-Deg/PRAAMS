import type { Metadata } from "next";
import Link from "next/link";

import { RoleBadge } from "@/components/role-badge";
import { PermissionToggle } from "@/components/permission-toggle";
import { requireAdministrator } from "@/lib/auth/session";
import {
  ALL_ROLES,
  getGrantedMatrix,
  PERMISSION_LABELS,
  TOGGLEABLE_PERMISSIONS,
} from "@/lib/permissions/data";

export const metadata: Metadata = {
  title: "Role Permissions",
};

const ROLE_SUBTITLES: Record<string, string> = {
  receptionist: "Front desk · registration & scheduling",
  healthcare_professional: "Clinical care · records & history",
  administrator: "Administration · accounts, settings, reports",
};

export default async function PermissionsPage({
  searchParams,
}: PageProps<"/admin/permissions">): Promise<React.ReactElement> {
  const actor = await requireAdministrator();
  const params = await searchParams;
  const failed = params.notice === "error";

  const matrix = await getGrantedMatrix();

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-navy">Role-based access permissions</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Configure which capabilities each role holds (UC-03). Toggles can only{" "}
        <strong>narrow</strong> what the database&apos;s Row Level Security baseline already
        permits — they can never widen access beyond it (NFR-09 least privilege).
      </p>

      {failed && (
        <p role="alert" className="mt-5 rounded-md border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          The permission change could not be saved. Please try again.
        </p>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {ALL_ROLES.map((role) => (
          <section
            key={role}
            className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"
          >
            <header className="border-b border-gray-200 pb-3">
              <RoleBadge role={role} />
              <p className="mt-2 text-xs text-gray-500">{ROLE_SUBTITLES[role]}</p>
            </header>

            <ul className="divide-y divide-gray-100">
              {TOGGLEABLE_PERMISSIONS.map((permission) => {
                const granted = matrix[role].has(permission);
                return (
                  <li key={permission} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-gray-700">
                      {PERMISSION_LABELS[permission]}
                    </span>
                    <PermissionToggle role={role} permission={permission} granted={granted} />
                  </li>
                );
              })}

              {/* Fixed built-in rule */}
              <li className="flex items-center justify-between gap-3 py-3">
                <div>
                  <span className="text-sm text-gray-700">{PERMISSION_LABELS["staff.manage"]}</span>
                  <p className="text-xs text-gray-400">Built-in rule — not toggleable</p>
                </div>
                <span
                  className={`inline-block min-w-[92px] rounded-full px-3 py-1 text-center text-xs font-semibold ${
                    role === "administrator"
                      ? "bg-navy-tint text-navy"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {role === "administrator" ? "Always on" : "—"}
                </span>
              </li>
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 rounded-md border-l-4 border-navy-light bg-navy-tint px-4 py-3 text-sm text-navy-dark">
        Signed in as {actor.full_name}. Every toggle here is written to the audit trail,
        and grants take effect immediately across all admin screens and server actions.
        Need staff changes instead? Head to{" "}
        <Link href="/admin/staff" className="font-semibold underline underline-offset-2">
          Manage staff accounts
        </Link>
        .
      </p>
    </main>
  );
}
