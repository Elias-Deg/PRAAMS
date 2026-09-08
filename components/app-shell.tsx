import Link from "next/link";

import { Icon } from "@/components/icons";
import { ShellNav } from "@/components/shell-nav";
import { Topbar } from "@/components/topbar";
import { signOut } from "@/lib/actions/auth";
import type { ProfileRow } from "@/types/database";

const WIDTHS = {
  narrow: "max-w-2xl",
  medium: "max-w-3xl",
  wide: "max-w-5xl",
  xwide: "max-w-7xl",
} as const;

/**
 * Persistent authenticated shell (dashboard-v2 design, §14): full-height dark
 * sidebar with brand mark, live patients hero card, role-filtered nav and
 * quick actions; the content column carries the Topbar (section title,
 * patient search, user chip). Rendered by the (app) layout so the shell never
 * remounts — loading skeletons appear inside it, already wearing the design.
 */
export function AppShell({
  profile,
  patientCount,
  children,
  width = "wide",
}: {
  profile: ProfileRow;
  patientCount: number;
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
}): React.ReactElement {
  const mayRegister =
    profile.role === "receptionist" || profile.role === "administrator";

  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-sidebar text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col print:hidden">
        {/* Brand + mobile sign-out */}
        <div className="group flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent shadow-pop group-hover:animate-wiggle"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              className="h-4 w-4 text-white"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-display text-base font-bold tracking-wide">
            PRAAMS Clinic
          </span>
          <form action={signOut} className="ml-auto lg:hidden">
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="rounded-2xl p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Hero count — desktop only */}
        <div className="hidden px-4 pt-5 lg:block">
          <div className="animate-pop-in rounded-2xl bg-gradient-to-br from-accent-light to-accent p-4 shadow-pop">
            <p className="font-display text-3xl font-bold leading-none">
              {patientCount.toLocaleString("en-US")}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/85">
              <Icon name="users" className="h-3.5 w-3.5" />
              Registered patients
            </p>
          </div>
        </div>

        {/* Mobile: horizontal icon nav / Desktop: full sidebar */}
        <nav aria-label="Primary" className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <ShellNav role={profile.role} />
        </nav>

        {/* Quick actions — desktop only (mobile signs out from the brand row) */}
        <div className="hidden border-t border-white/10 px-3 py-4 lg:block">
          {mayRegister && (
            <Link
              href="/patients/new"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              <Icon name="plus" className="h-5 w-5" />
              New patient
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              <Icon name="logout" className="h-5 w-5" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <Topbar fullName={profile.full_name} role={profile.role} />
        <main
          id="main-content"
          className={`mx-auto w-full ${WIDTHS[width]} flex-1 animate-fade-in px-4 py-8 sm:px-6 lg:px-10 lg:py-8`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
