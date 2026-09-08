"use client";

import { useActionState } from "react";

import { signIn } from "@/lib/actions/auth";
import type { LoginActionState } from "@/lib/validation/auth";

const INITIAL_STATE: LoginActionState = { status: "idle" };

/**
 * Pill-style inputs (§14 login v2) — playful focus: fill lifts to white and
 * a soft blue ring shadow pops around the pill.
 */
const inputClasses =
  "mt-2 block w-full rounded-full border-2 bg-surface px-5 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:shadow-pop";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-status-cancelled">
      {message}
    </p>
  );
}

export function LoginForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);

  const showAlert = state.status === "locked" || state.status === "rejected";

  return (
    <form action={formAction} className="mt-8 space-y-6" noValidate>
      {showAlert && (
        <div
          role="alert"
          className="animate-pop-in rounded-2xl border-l-4 border-status-cancelled bg-status-cancelled/10 px-4 py-3 text-sm text-gray-800"
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-gray-900">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          placeholder="Enter your email"
          className={`${inputClasses} ${
            state.fieldErrors?.email ? "border-status-cancelled" : "border-gray-200"
          }`}
        />
        <FieldError id="email-error" message={state.fieldErrors?.email} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-900">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          placeholder="Enter your password"
          className={`${inputClasses} ${
            state.fieldErrors?.password ? "border-status-cancelled" : "border-gray-200"
          }`}
        />
        <FieldError id="password-error" message={state.fieldErrors?.password} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`w-full rounded-full bg-accent py-3 font-display text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${
          pending ? "animate-pulse" : ""
        }`}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
