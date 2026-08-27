"use client";

import { useActionState } from "react";

import { createStaff, updateStaff } from "@/lib/actions/staff";
import type { StaffActionState } from "@/lib/validation/staff";

const INITIAL_STATE: StaffActionState = { status: "idle" };

const inputClasses =
  "mt-1.5 block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light";
const labelClasses = "block text-sm font-medium text-gray-700";

function FieldError({ message }: { message?: string }): React.ReactElement | null {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-status-cancelled">
      {message}
    </p>
  );
}

const ROLE_OPTIONS = [
  { value: "receptionist", label: "Receptionist" },
  { value: "healthcare_professional", label: "Healthcare Professional" },
  { value: "administrator", label: "Administrator" },
];

interface StaffFormInitial {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

/**
 * Shared account form for UC-02 — create mode asks for an initial temporary
 * password (handed over in person); edit mode locks the email identity and
 * manages name / phone / role.
 */
export function StaffAccountForm({
  mode,
  profileId,
  initial,
}: {
  mode: "create" | "edit";
  profileId?: string;
  initial?: StaffFormInitial;
}): React.ReactElement {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createStaff : updateStaff,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && <input type="hidden" name="id" value={profileId} />}

      {state.message && (
        <div
          role="alert"
          className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          {state.message}
        </div>
      )}
      {state.status === "saved" && (
        <p
          role="status"
          className="rounded-sm border-l-4 border-status-completed bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          Saved.
        </p>
      )}

      {/* --- NAME / EMAIL / PHONE --- */}
      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={initial?.fullName ?? ""}
          aria-invalid={state.fieldErrors?.fullName ? true : undefined}
          placeholder="e.g. Hiwot Bekele"
          className={`${state.fieldErrors?.fullName ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.fullName} />
      </div>

      <div>
        <label htmlFor="email" className={labelClasses}>
          Email address{" "}
          {mode === "edit" && (
            <span className="font-normal text-gray-400">(cannot be changed)</span>
          )}
        </label>
        <input
          id="email"
          name="email"
          type={mode === "create" ? "email" : undefined}
          autoComplete="email"
          defaultValue={initial?.email ?? ""}
          readOnly={mode === "edit"}
          tabIndex={mode === "edit" ? -1 : undefined}
          placeholder="name@praams.clinic"
          className={`${
            mode === "edit" ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""
          } ${inputClasses}`}
        />
        {mode === "edit" && (
          <p className="mt-1.5 text-xs text-gray-500">
            The email is this account&apos;s sign-in identity and stays fixed.
          </p>
        )}
        {mode === "create" && <FieldError message={state.fieldErrors?.email} />}
      </div>

      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={initial?.phone ?? ""}
          aria-invalid={state.fieldErrors?.phone ? true : undefined}
          placeholder="+251911234567"
          className={`${state.fieldErrors?.phone ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.phone} />
      </div>

      {/* --- ROLE / PASSWORD / SUBMIT --- */}
      <div>
        <label htmlFor="role" className={labelClasses}>
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={initial?.role ?? ""}
          aria-invalid={state.fieldErrors?.role ? true : undefined}
          className={`${state.fieldErrors?.role ? "border-status-cancelled" : ""} ${inputClasses}`}
        >
          <option value="" disabled>
            Choose a role…
          </option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.role} />
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="password" className={labelClasses}>
            Initial temporary password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            className={`${state.fieldErrors?.password ? "border-status-cancelled" : ""} ${inputClasses}`}
          />
          <FieldError message={state.fieldErrors?.password} />
          <p className="mt-1.5 text-xs text-gray-500">
            At least 8 characters, including a letter, a number and a symbol. Hand these
            credentials to the staff member in person; they should change their password at
            first sign-in (self-service change arrives with a later phase).
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px]"
      >
        {pending ? (mode === "create" ? "Creating…" : "Saving…") : mode === "create" ? "Create account" : "Save changes"}
      </button>
    </form>
  );
}