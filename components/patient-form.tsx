"use client";

import { useActionState } from "react";

import { createPatient, updatePatient } from "@/lib/actions/patients";
import type { PatientActionState } from "@/lib/validation/patient";

const INITIAL_STATE: PatientActionState = { status: "idle" };

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

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

interface PatientFormInitial {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

/** UC-04 / UC-05 demographic form (create|edit) shared across routes. */
export function PatientForm({
  mode,
  patientId,
  initial,
}: {
  mode: "create" | "edit";
  patientId?: string;
  initial?: PatientFormInitial;
}): React.ReactElement {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createPatient : updatePatient,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && <input type="hidden" name="id" value={patientId} />}

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

      {/* --- IDENTITY FIELDS --- */}
      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="off"
          defaultValue={initial?.fullName ?? ""}
          aria-invalid={state.fieldErrors?.fullName ? true : undefined}
          placeholder="e.g. Selam Tesfaye"
          className={`${state.fieldErrors?.fullName ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.fullName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="dateOfBirth" className={labelClasses}>
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={initial?.dateOfBirth ?? ""}
            aria-invalid={state.fieldErrors?.dateOfBirth ? true : undefined}
            className={`${state.fieldErrors?.dateOfBirth ? "border-status-cancelled" : ""} ${inputClasses}`}
          />
          <FieldError message={state.fieldErrors?.dateOfBirth} />
        </div>
        <div>
          <label htmlFor="gender" className={labelClasses}>
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={initial?.gender ?? ""}
            aria-invalid={state.fieldErrors?.gender ? true : undefined}
            className={`${state.fieldErrors?.gender ? "border-status-cancelled" : ""} ${inputClasses}`}
          >
            <option value="" disabled>
              Choose…
            </option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.gender} />
        </div>
      </div>

      {/* --- CONTACT FIELDS --- */}
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
          placeholder="+251911402002"
          className={`${state.fieldErrors?.phone ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.phone} />
      </div>

      <div>
        <label htmlFor="address" className={labelClasses}>
          Address <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={initial?.address ?? ""}
          aria-invalid={state.fieldErrors?.address ? true : undefined}
          placeholder="Sub-city, woreda, house number…"
          className={`${state.fieldErrors?.address ? "border-status-cancelled" : ""} ${inputClasses} resize-y`}
        />
        <FieldError message={state.fieldErrors?.address} />
      </div>

      <div>
        <label htmlFor="emergencyContact" className={labelClasses}>
          Emergency contact <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="emergencyContact"
          name="emergencyContact"
          autoComplete="off"
          defaultValue={initial?.emergencyContact ?? ""}
          aria-invalid={state.fieldErrors?.emergencyContact ? true : undefined}
          placeholder="Name and phone, e.g. Yonas Tesfaye +251911402003"
          className={`${state.fieldErrors?.emergencyContact ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.emergencyContact} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px]"
      >
        {pending
          ? mode === "create"
            ? "Registering…"
            : "Saving…"
          : mode === "create"
            ? "Register patient"
            : "Save changes"}
      </button>
    </form>
  );
}