"use client";

import { useActionState } from "react";

import { signIn } from "@/lib/actions/auth";
import type { LoginActionState } from "@/lib/validation/auth";

const INITIAL_STATE: LoginActionState = { status: "idle" };

const inputClasses =
  "mt-1.5 block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-none outline-none transition-colors placeholder:text-gray-400 focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-status-cancelled">
      {message}
    </p>
  );
}

export function LoginForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);

  const showAlert = state.status === "locked" || state.status === "rejected";

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      {showAlert && (
        <div
          role="alert"
          className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
          placeholder="name@praams.clinic"
          className={`${
            state.fieldErrors?.email
              ? "border-status-cancelled"
              : ""
          } ${inputClasses}`}
        />
        <FieldError id="email-error" message={state.fieldErrors?.email} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          placeholder="Your password"
          className={`${
            state.fieldErrors?.password ? "border-status-cancelled" : ""
          } ${inputClasses}`}
        />
        <FieldError id="password-error" message={state.fieldErrors?.password} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Login"}
      </button>
    </form>
  );
}