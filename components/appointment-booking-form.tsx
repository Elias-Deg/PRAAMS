"use client";

import { useActionState, useState } from "react";

import { PatientSearchCombobox } from "@/components/patient-search-combobox";
import { SlotPicker } from "@/components/slot-picker";
import { scheduleAppointment } from "@/lib/actions/appointments";
import { todayInAddis } from "@/lib/constants";
import type { AppointmentActionState } from "@/lib/validation/appointments";

const INITIAL_STATE: AppointmentActionState = { status: "idle" };

const inputClasses =
  "mt-1.5 block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light";
const labelClasses = "block text-sm font-medium text-gray-700";

/** UC-09 · FR-13/14 — patient → HP → day → slot → reason booking flow. */
export function AppointmentBookingForm({
  hps,
  preselectedPatient,
}: {
  hps: { id: string; full_name: string }[];
  preselectedPatient?: { id: string; label: string };
}): React.ReactElement {
  const [state, formAction, pending] = useActionState(scheduleAppointment, INITIAL_STATE);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(todayInAddis());
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message && (
        <div
          role="alert"
          className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          {state.message}
        </div>
      )}

      <div>
        <span className={labelClasses}>Patient</span>
        <div className="mt-1.5">
          <PatientSearchCombobox
            preselectedId={preselectedPatient?.id}
            preselectedLabel={preselectedPatient?.label}
          />
        </div>
        {state.fieldErrors?.patientId && (
          <p role="alert" className="mt-1.5 text-sm text-status-cancelled">
            {state.fieldErrors.patientId}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="staffId" className={labelClasses}>
          Healthcare professional
        </label>
        <select
          id="staffId"
          name="staffId"
          value={staffId}
          onChange={(event) => {
            setStaffId(event.target.value);
            setSlot(null);
          }}
          aria-invalid={state.fieldErrors?.staffId ? true : undefined}
          className={`${state.fieldErrors?.staffId ? "border-status-cancelled" : ""} ${inputClasses}`}
        >
          <option value="" disabled>
            Choose…
          </option>
          {hps.map((hp) => (
            <option key={hp.id} value={hp.id}>
              {hp.full_name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.staffId && (
          <p role="alert" className="mt-1.5 text-sm text-status-cancelled">
            {state.fieldErrors.staffId}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="apptDate" className={labelClasses}>
          Date
        </label>
        <input
          id="apptDate"
          type="date"
          min={todayInAddis()}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSlot(null);
          }}
          className={`${inputClasses} sm:w-56`}
        />
        {staffId !== "" && (
          <div className="mt-3">
            <SlotPicker
              staffId={staffId}
              date={date}
              selected={slot}
              onSelect={setSlot}
            />
          </div>
        )}
        {state.fieldErrors?.dateTime && (
          <p role="alert" className="mt-1.5 text-sm text-status-cancelled">
            {state.fieldErrors.dateTime}
          </p>
        )}
        <input type="hidden" name="dateTime" value={slot ?? ""} />
      </div>

      <div>
        <label htmlFor="reason" className={labelClasses}>
          Reason for visit <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="e.g. General check-up"
          className={`${inputClasses} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={pending || slot === null}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
      >
        {pending ? "Booking…" : "Confirm booking"}
      </button>
      {slot === null && (
        <p className="text-xs text-gray-500">Choose a free slot to enable booking.</p>
      )}
    </form>
  );
}