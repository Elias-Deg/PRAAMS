import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { RoleBadge } from "@/components/role-badge";
import { requireAdministrator } from "@/lib/auth/session";
import { deleteStaff, toggleStaffStatus } from "@/lib/actions/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Manage Staff",
};

const NOTICES: Record<string, { text: string; tone: "ok" | "warn" | "err" }> = {
  created: { text: "Account created. Hand over the temporary password securely.", tone: "ok" },
  deactivated: { text: "Account deactivated. The staff member can no longer sign in.", tone: "ok" },
  reactivated: { text: "Account reactivated and its failed-login counter reset.", tone: "ok" },
  deleted: { text: "Account deleted.", tone: "ok" },
  noop: { text: "No change was needed.", tone: "ok" },
  saved: { text: "Changes saved.", tone: "ok" },
  error: { text: "Something went wrong. Please try again.", tone: "err" },
  "err-not-found": { text: "That account no longer exists.", tone: "err" },
  "err-self-deactivate": { text: "You cannot deactivate your own account.", tone: "warn" },
  "err-self-delete": { text: "You cannot delete your own account.", tone: "warn" },
  "err-last-admin": {
    text: "Refused: at least one active administrator must remain.",
    tone: "warn",
  },
  "err-authored-records": {
    text: "This clinician has authored medical records, which are permanent (FR-12). Deactivate instead of deleting.",
    tone: "warn",
  },
  "err-linked-appointments": {
    text: "This person is linked to appointments. Deactivate instead of deleting.",
    tone: "warn",
  },
};

const TONE_STYLES = {
  ok: "border-status-completed",
  warn: "border-status-no-show",
  err: "border-status-cancelled",
} as const;

export default async function StaffListPage({
  searchParams,
}: PageProps<"/admin/staff">): Promise<React.ReactElement> {
  const actor = await requireAdministrator();
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : undefined;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  const staff = (data ?? []) as unknown as ProfileRow[];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Manage staff accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            {staff.length} account{staff.length === 1 ? "" : "s"} · create, update,
            deactivate or remove team access (UC-02).
          </p>
        </div>
        <Link
          href="/admin/staff/new"
          className="rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          + New account
        </Link>
      </div>

      {notice && (
        <p
          role={notice.tone === "err" ? "alert" : "status"}
          className={`mt-6 rounded-md border-l-4 ${TONE_STYLES[notice.tone]} bg-white px-4 py-3 text-sm text-gray-800 shadow-sm`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-navy-tint text-xs uppercase tracking-wider text-navy">
            <tr>
              <th scope="col" className="px-5 py-3">Name</th>
              <th scope="col" className="px-5 py-3">Role</th>
              <th scope="col" className="px-5 py-3">Email</th>
              <th scope="col" className="px-5 py-3">Phone</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {staff.map((member) => {
              const isSelf = member.id === actor.id;
              const inactive = member.status !== "active";
              return (
                <tr key={member.id} className={inactive ? "opacity-60" : undefined}>
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {member.full_name}
                    {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-5 py-3.5"><RoleBadge role={member.role} /></td>
                  <td className="px-5 py-3.5 text-gray-600">{member.email}</td>
                  <td className="px-5 py-3.5 text-gray-600">{member.phone ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        inactive
                          ? "bg-status-no-show text-white"
                          : "bg-status-completed text-white"
                      }`}
                    >
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="mr-4 font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      Edit
                    </Link>

                    {!inactive && (
                      <form action={toggleStaffStatus} className="mr-2 inline-block">
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="targetStatus" value="inactive" />
                        <ConfirmSubmitButton
                          confirmation={`Deactivate ${member.full_name}? They will be signed out and unable to log in until reactivated.`}
                          disabled={isSelf}
                          title={isSelf ? "You cannot deactivate your own account" : undefined}
                          className="rounded-sm border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-status-cancelled transition-colors hover:border-status-cancelled hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Deactivate
                        </ConfirmSubmitButton>
                      </form>
                    )}
                    {inactive && (
                      <form action={toggleStaffStatus} className="mr-2 inline-block">
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="targetStatus" value="active" />
                        <ConfirmSubmitButton
                          confirmation={`Reactivate ${member.full_name}? Their failed-login counter will be reset.`}
                          className="rounded-sm border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-status-completed transition-colors hover:border-status-completed hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
                        >
                          Reactivate
                        </ConfirmSubmitButton>
                      </form>
                    )}

                    <form action={deleteStaff} className="inline-block">
                      <input type="hidden" name="id" value={member.id} />
                      <ConfirmSubmitButton
                        confirmation={`Permanently DELETE ${member.full_name} (${member.email})? This cannot be undone.`}
                        disabled={isSelf}
                        title={isSelf ? "You cannot delete your own account" : undefined}
                        className="ml-2 rounded-sm border border-transparent bg-none px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:text-status-cancelled hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}