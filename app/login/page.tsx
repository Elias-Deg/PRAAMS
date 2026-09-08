import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Staff Login",
};

const REASON_NOTICES: Record<string, string> = {
  // Shown when proxy.ts ends an idle session (FR-05).
  idle: "You were signed out automatically after a period of inactivity.",
};

/**
 * UC-01 · login screen v2 (§14 reference design): blue-gradient welcome panel
 * flowing into a white sign-in card, wearing the dashboard-v2 accent tokens.
 * Playful motion: springy card entrance, floating bubbles, gently floating
 * logo that wiggles on hover — all neutralized by the global
 * prefers-reduced-motion rule. The circular mark below is a logo PLACEHOLDER
 * — swap in the real PRAAMS logo asset there when available.
 */
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">): Promise<React.ReactElement> {
  const params = await searchParams;
  const reasonNotice =
    typeof params.reason === "string" ? REASON_NOTICES[params.reason] : undefined;

  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10"
    >
      <div className="grid w-full max-w-4xl animate-pop-in overflow-hidden rounded-3xl bg-white shadow-soft lg:grid-cols-[45%_1fr]">
        {/* Welcome panel — blue gradient with a wavy edge into the form side */}
        <section className="relative isolate bg-gradient-to-b from-accent to-accent-light px-8 py-12 text-white sm:px-10 lg:py-14">
          <svg
            aria-hidden
            viewBox="0 0 40 640"
            preserveAspectRatio="none"
            className="absolute right-0 top-0 hidden h-full w-10 lg:block"
          >
            <path
              d="M40 0 L40 640 L14 640 C34 556 2 496 18 428 C32 368 4 318 20 248 C34 188 6 128 22 68 C28 40 34 18 40 0 Z"
              fill="#ffffff"
            />
          </svg>

          {/* Drifting bubbles */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-6 top-14 -z-10 h-16 w-16 animate-float rounded-full bg-white/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-14 top-36 -z-10 h-9 w-9 animate-float rounded-full bg-white/10 [animation-delay:900ms]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-12 left-14 -z-10 h-7 w-7 animate-float rounded-full bg-white/15 [animation-delay:1500ms]"
          />

          <p className="font-display text-xl font-semibold text-white/95">Welcome to</p>

          {/* Logo placeholder — replace the inner mark with the real PRAAMS logo */}
          <div className="group mt-9 flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="grid h-20 w-20 animate-float place-items-center rounded-full bg-white shadow-pop"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                className="h-8 w-8 text-accent group-hover:animate-wiggle"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <p className="font-display text-2xl font-bold tracking-wide">PRAAMS</p>
          </div>

          <p className="mt-9 text-center text-xs leading-relaxed text-white/80">
            Patient Record &amp; Appointment Management — the staff portal of
            Addis Ababa Private Clinic.
          </p>

          <div className="mt-10 hidden border-t border-white/25 pt-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 lg:block">
            Secure staff access
          </div>
        </section>

        {/* Sign-in panel */}
        <section className="px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
          <h1 className="text-center font-display text-2xl font-bold text-gray-900">
            Sign in to your account.
          </h1>

          {reasonNotice && (
            <p
              role="status"
              className="mt-6 animate-pop-in rounded-2xl bg-navy-tint px-4 py-3 text-sm text-navy-dark"
            >
              {reasonNotice}
            </p>
          )}

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
