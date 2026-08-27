import { redirect } from "next/navigation";

/**
 * The real entry routing happens in proxy.ts (unauthenticated → /login,
 * authenticated → /dashboard); this stub keeps bare requests to "/" defined
 * should the proxy be bypassed during local tooling.
 */
export default function Home(): never {
  redirect("/dashboard");
}
