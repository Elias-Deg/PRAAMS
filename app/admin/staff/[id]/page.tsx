import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StaffAccountForm } from "@/components/staff-account-form";
import { deleteStaff, toggleStaffStatus } from "@/lib/actions/staff";
import { requireAdministrator } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Edit Staff Account",
};

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const actor = await requireAdministrator();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  const member = (data ?? null) as unknown as ProfileRow | null;
  if (!member) notFound();

  const isSelf = member.id === actor.id;

  // Mirror the server-side deletion guards so the UI explains itself honestly.
  const [recordsRef, apptStaffRef, apptBookerRef] = await Promise.all([
    supabase.from("medical_records").select("id", { count: "exact" }).limit(1).eq("author_id", id),
    supabase.from("appointments").select("id", { count: "exact" }).limit(1).eq("staff_id", id),
    supabase.from("appointments").select("id", { count: "exact" }).limit(1).eq("scheduled_by", id),
  ]);
  const linkedRecords = (recordsRef.count ?? 0) > 0;
  const linkedAppointments =
    (apptStaffRef.count ?? 0) > 0 || (apptBookerRef.count ?? 0) > 0;

  let activeOtherAdmins = 0;
  if (member.role === "administrator") {
    const res = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "administrator")
      .eq("status", "active")
      .neq("id", id);
    activeOtherAdmins = res.count ?? 0;
  }

  const canDelete = !isSelf && !linkedRecords && !linkedAppointments &&
    (member.role !== "administrator" || activeOtherAdmins >= 1);
  const canDeactivate = !isSelf &&
    (member.role !== "administrator" || activeOtherAdmins >= 1);

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/admin/staff"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to staff list
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">{member.full_name}</h1>
      <p className="mt-1 text-sm text-gray-600">
        Account details · created{" "}
        {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
          new Date(member.created_at),
        )}
      </p>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <StaffAccountForm
          mode="edit"
          profileId={member.id}
          initial={{
            fullName: member.full_name,
            email: member.email,
            phone: member.phone ?? "",
            role: member.role,
          }}
        />
      </section>

      {/* --- DANGER ZONE --- */}
      <section className="mt-8 rounded-md border border-status-cancelled/40 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-status-cancelled">
          Danger zone
        </h2>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {member.status === "active" ? "Deactivate account" : "Reactivate account"}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {member.status === "active"
                ? "The staff member is signed out and cannot log in until reactivated."
                : "Sign-in resumes with their existing credentials; failed-login counters reset."}
            </p>
            {!canDeactivate && (
              <p className="mt-1 text-xs text-status-no-show">
                {isSelf
                  ? "You cannot change the status of your own account."
                  : "Refused: at least one other active administrator must remain."}
              </p>
            )}
          </div>
          <form action={toggleStaffStatus}>
            <input type="hidden" name="id" value={member.id} />
            <input
              type="hidden"
              name="targetStatus"
              value={member.status === "active" ? "inactive" : "active"}
            />
            <ConfirmSubmitButton
              confirmation={
                member.status === "active"
                  ? `Deactivate ${member.full_name}? They will be unable to sign in until reactivated.`
                  : `Reactivate ${member.full_name}?`
              }
              disabled={!canDeactivate}
              className={`rounded-sm px-4 py-2 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 ${
                member.status === "active"
                  ? "bg-status-no-show hover:bg-[#756033]"
                  : "bg-status-completed hover:opacity-90"
              }`}
            >
              {member.status === "active" ? "Deactivate…" : "Reactivate…"}
            </ConfirmSubmitButton>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account permanently</p>
            <p className="mt-0.5 max-w-md text-sm text-gray-500">
              Removes the login and profile for good.
            </p>
            {!canDelete && (
              <ul className="mt-1 list-inside list-disc text-xs text-status-no-show marker:text-status-no-show">
                {isSelf && <li>You cannot delete your own account.</li>}
                {linkedRecords && (
                  <li>
                    Has authored medical records — permanent entries must keep their author
                    (FR-12). Deactivate instead.
                  </li>
                )}
                {linkedAppointments && (
                  <li>Is linked to appointments. Deactivate instead.</li>
                )}
                {member.role === "administrator" && activeOtherAdmins < 1 && !isSelf && (
                  <li>At least one active administrator must remain.</li>
                )}
              </ul>
            )}
          </div>
          <form action={deleteStaff}>
            <input type="hidden" name="id" value={member.id} />
            <ConfirmSubmitButton
              confirmation={`Permanently DELETE ${member.full_name} (${member.email})? This cannot be undone.`}
              disabled={!canDelete}
              className="rounded-sm border border-status-cancelled bg-white px-4 py-2 text-sm font-bold text-status-cancelled transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete…
            </ConfirmSubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}