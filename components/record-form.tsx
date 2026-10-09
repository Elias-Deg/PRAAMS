"use client";

import { useActionState } from "react";

import { addMedicalRecord } from "@/lib/actions/patients";
import type { PatientActionState } from "@/lib/validation/patient";

const INITIAL_STATE: PatientActionState = { status: "idle" };

const inputClasses =
  "mt-1.5 block w-full rounded-full border-2 border-gray-200 bg-surface px-5 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:shadow-pop";
const labelClasses = "block text-sm font-bold text-gray-900";

function FieldError({ message }: { message?: string }): React.ReactElement | null {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-status-cancelled">
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
          className="animate-pop-in rounded-2xl border-l-4 border-status-cancelled bg-[#fae3e2]/60 px-4 py-3 text-sm text-gray-800"
        >
          {state.message}
        </div>
      )}

      <p className="animate-pop-in rounded-2xl border-l-4 border-status-no-show bg-[#f5ebd8]/60 px-4 py-3 text-sm text-gray-600">
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
          className={`${state.fieldErrors?.notes ? "border-status-cancelled" : ""} mt-2 block w-full resize-y rounded-3xl border-2 border-gray-200 bg-surface px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:shadow-pop`}
        />
        <FieldError message={state.fieldErrors?.notes} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent py-3.5 text-center font-display text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] sm:w-auto sm:min-w-[180px]"
      >
        {pending ? "Adding entry…" : "Add entry"}
      </button>
    </form>
  );
}

