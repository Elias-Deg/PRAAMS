"use server";

import { redirect } from "next/navigation";

import { LOCKOUT_MAX_ATTEMPTS } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatLockoutUntil, LoginActionState, LoginFormSchema } from "@/lib/validation/auth";

function fallbackUnexpected(): LoginActionState {
  return {
    status: "rejected",
    message: "Something went wrong signing you in. Please try again.",
  };
}

export async function signIn(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const emailInput = String(formData.get("email") ?? "");
  const rawPassword = String(formData.get("password") ?? "");

  const parsed = LoginFormSchema.safeParse({ email: emailInput, password: rawPassword });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      status: "field-error",
      values: { email: emailInput },
      fieldErrors: {
        email: flat.email?.[0],
        password: flat.password?.[0],
      },
    };
  }

  const email = parsed.data.email.toLowerCase();
  // NOTE: the password never leaves this scope except inside the Supabase
  // Auth request; it is never logged or echoed back (NFR-03).

  const admin = createSupabaseAdminClient();

  // 1. Honor an active lockout before touching Auth (UC-01).
  const { data: lockedUntil, error: lockErr } = await admin.rpc("is_login_locked", {
    p_email: email,
  });
  if (lockErr) return fallbackUnexpected();
  if (lockedUntil) {
    return {
      status: "locked",
      values: { email },
      message: `This account is temporarily locked after too many failed attempts. You can try again after ${formatLockoutUntil(lockedUntil)}.`,
    };
  }

  // 2. Verify credentials through Supabase Auth (anon key; RLS-bound client).
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (signInError) {
    const { data: newLockUntil, error: throttleErr } = await admin.rpc("register_failed_login", {
      p_email: email,
    });
    if (throttleErr) return fallbackUnexpected();

    if (newLockUntil) {
      return {
        status: "locked",
        values: { email },
        message: `This account is now locked after ${LOCKOUT_MAX_ATTEMPTS} consecutive failed attempts. You can try again after ${formatLockoutUntil(newLockUntil)}.`,
      };
    }

    return {
      status: "rejected",
      values: { email },
      message: "Incorrect email or password. Please try again.",
    };
  }

  // 3. Success → reset the throttle counter and resolve the operator profile.
  const { error: resetErr } = await admin.rpc("reset_failed_logins", { p_email: email });
  if (resetErr) return fallbackUnexpected();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fallbackUnexpected();

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      status: "rejected",
      values: { email },
      message: "This account is deactivated. Please contact your administrator.",
    };
  }

  // Session cookies were set by step 2's successful auth exchange.
  redirect("/dashboard");
}

/** Signs the operator out of Supabase Auth and returns to the login screen. */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}