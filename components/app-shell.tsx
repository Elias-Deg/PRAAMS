import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { ShellNav } from "@/components/shell-nav";
import { RoleBadge } from "@/components/role-badge";
import { signOut } from "@/lib/actions/auth";
import type { ProfileRow } from "@/types/database";

const WIDTHS = {
  narrow: "max-w-2xl",
  medium: "max-w-3xl",
  wide: "max-w-5xl",
  xwide: "max-w-6xl",
} as const;

/**
 * Persistent authenticated shell: navy sidebar (desktop) / top bar (mobile)
 * with role-filtered navigation, active-section highlight, user chip with
 * avatar + sign-out, and the #main-content landmark for the skip link.
 * Rendered by the (app) layout so the shell never remounts between pages —
 * loading skeletons appear inside it, already wearing the final design.
 */
export function AppShell({
  profile,
  children,
  width = "wide",
}: {
  profile: ProfileRow;
  children: React.ReactNode;
  width?: keyof typeof WIDTHS;
}): React.ReactElement {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:m-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:flex-col lg:rounded-3xl lg:shadow-soft print:hidden">
        {/* Brand + mobile sign-out */}
        <div className="flex h-16 shrink-0 items-center justify-between rounded-t-3xl border-b border-white/10 px-6">
          <span className="text-base font-bold tracking-widest">PRAAMS</span>
          <form action={signOut} className="lg:hidden">
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

        {/* Mobile: horizontal icon nav / Desktop: full sidebar */}
        <nav aria-label="Primary" className="lg:flex-1 lg:overflow-y-auto lg:py-3">
          <ShellNav role={profile.role} />
        </nav>

        {/* User chip — desktop only (mobile uses the header sign-out) */}
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <Avatar name={profile.full_name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.full_name}</p>
              <div className="mt-0.5">
                <RoleBadge role={profile.role} />
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <main
          id="main-content"
          className={`mx-auto w-full ${WIDTHS[width]} flex-1 animate-fade-in px-4 py-8 sm:px-6 lg:px-10 lg:py-10`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
