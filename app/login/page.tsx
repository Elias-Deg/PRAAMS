import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Staff Login",
};

const REASON_NOTICES: Record<string, string> = {
  // Shown when proxy.ts ends an idle session (FR-05).
  idle: "You were signed out automatically after a period of inactivity.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">): Promise<React.ReactElement> {
  const params = await searchParams;
  const reasonNotice =
    typeof params.reason === "string" ? REASON_NOTICES[params.reason] : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      {/* Brand strip */}
      <header className="flex h-14 items-center justify-center bg-navy px-6">
        <span className="text-lg font-bold tracking-widest text-white">PRAAMS</span>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <section className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-navy">Staff Login</h1>
            <p className="mt-1.5 text-sm text-gray-600">
              Sign in with your clinic email account.
            </p>

            {reasonNotice && (
              <p
                role="status"
                className="mt-5 rounded-sm border-l-4 border-navy-light bg-navy-tint px-4 py-3 text-sm text-navy-dark"
              >
                {reasonNotice}
              </p>
            )}

            <LoginForm />
          </section>

          <footer className="mt-6 text-center text-xs text-gray-400">
            Patient Record &amp; Appointment Management System · Addis Ababa Private Clinic
          </footer>
        </div>
      </main>
    </div>
  );
}
