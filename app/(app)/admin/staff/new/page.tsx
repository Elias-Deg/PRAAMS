import type { Metadata } from "next";
import Link from "next/link";

import { StaffAccountForm } from "@/components/staff-account-form";import { requireAdministrator } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New Staff Account",
};

export default async function NewStaffPage(): Promise<React.ReactElement> {
  await requireAdministrator();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/admin/staff"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        ← Back to staff list
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">New staff account</h1>
      <p className="mt-1 text-sm text-gray-600">
        Creates a Supabase Auth login plus the matching profile row. The account becomes
        usable immediately after creation.
      </p>

      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
        <StaffAccountForm mode="create" />
      </section>
    </div>
  );
}


