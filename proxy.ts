import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { INACTIVITY_TIMEOUT_MS, LAST_ACTIVE_COOKIE } from "@/lib/constants";

/** Routes reachable without a session. Everything below a protected prefix requires one. */
const PUBLIC_PATHS = new Set(["/", "/login"]);
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/patients",
  "/appointments",
  "/admin",
  "/api",
];

/**
 * Request proxy (Next.js 16's renamed middleware):
 * 1. refreshes Supabase Auth cookies on every navigation,
 * 2. enforces FR-05 inactivity termination,
 * 3. gates protected paths behind an authenticated session.
 *
 * Optimistic checks only — role-level authorization is enforced where it is
 * trustworthy (server components/server actions backed by RLS), never here.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]): void {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT against the Auth server (never trust raw
  // session contents) and transparently refreshes expired tokens.
  let user: object | null = null;
  try {
    user = (await supabase.auth.getUser()).data.user ?? null;
  } catch {
    user = null; // network hiccup → treat as guest; protected pages will bounce to /login
  }

  const path = request.nextUrl.pathname;

  // FR-05: end sessions whose recorded last activity is older than the timeout.
  if (user && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    const lastActive = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value ?? 0);
    if (Number.isFinite(lastActive) && lastActive > 0 && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
      await supabase.auth.signOut();
      const idleRedirect = NextResponse.redirect(
        new URL("/login?reason=idle", request.nextUrl.origin),
      );
      // The signOut above ran through setAll against `response`; mirror those
      // clearances onto the redirect we are actually returning.
      request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-"))
        .forEach((c) => idleRedirect.cookies.delete(c.name));
      idleRedirect.cookies.delete(LAST_ACTIVE_COOKIE);
      return idleRedirect;
    }
  }

  if (!user && !PUBLIC_PATHS.has(path)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  if (path === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/login", request.nextUrl.origin),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};