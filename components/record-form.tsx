"use client";

import { useActionState } from "react";

import { addMedicalRecord } from "@/lib/actions/patients";
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

/** UC-07 · FR-10 — permanent clinical entry form (healthcare professionals only). */
export function RecordForm({ patientId }: { patientId: string }): React.ReactElement {
  const [state, formAction, pending] = useActionState(addMedicalRecord, INITIAL_STATE);

  // Default to the current local date/time (datetime-local expects YYYY-MM-DDTHH:mm).
  const now = new Date();
  const localNow =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` +
    `-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="patientId" value={patientId} />

      {state.message && (
        <div
          role="alert"
          className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          {state.message}
        </div>
      )}

      <p className="rounded-sm border-l-4 border-status-no-show bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
        Entries are permanent once saved — they cannot be edited or removed (FR-12).
      </p>

      <div>
        <label htmlFor="visitDate" className={labelClasses}>
          Visit date &amp; time
        </label>
        <input
          id="visitDate"
          name="visitDate"
          type="datetime-local"
          max={localNow}
          defaultValue={localNow}
          aria-invalid={state.fieldErrors?.visitDate ? true : undefined}
          className={`${state.fieldErrors?.visitDate ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.visitDate} />
      </div>

      <div>
        <label htmlFor="diagnosis" className={labelClasses}>
          Diagnosis
        </label>
        <input
          id="diagnosis"
          name="diagnosis"
          defaultValue=""
          aria-invalid={state.fieldErrors?.diagnosis ? true : undefined}
          placeholder="e.g. Follow-up — pharyngitis resolved"
          className={`${state.fieldErrors?.diagnosis ? "border-status-cancelled" : ""} ${inputClasses}`}
        />
        <FieldError message={state.fieldErrors?.diagnosis} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Clinical notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          aria-invalid={state.fieldErrors?.notes ? true : undefined}
          placeholder="Presenting symptoms, examination findings, treatment given, advice…"
          className={`${state.fieldErrors?.notes ? "border-status-cancelled" : ""} ${inputClasses} resize-y`}
        />
        <FieldError message={state.fieldErrors?.notes} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[180px]"
      >
        {pending ? "Adding entry…" : "Add entry"}
      </button>
    </form>
  );
}