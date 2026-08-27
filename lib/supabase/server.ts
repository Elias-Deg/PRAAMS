import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client factory for Server Components, Server Actions,
 * and Route Handlers. Reads/writes auth session cookies through next/headers.
 * Uses the anon key — every query runs as the signed-in user and stays
 * subject to RLS. Never use this to bypass policies.
 *
 * Note: cookie writes silently no-op inside Server Component render (the
 * response has already started); session refresh happens in proxy.ts (Phase 1).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; proxy.ts refreshes.
          }
        },
      },
    },
  );
}