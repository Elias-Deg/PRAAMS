"use client";

import { useActionState, useState } from "react";

import { SlotPicker } from "@/components/slot-picker";
import { rescheduleAppointment } from "@/lib/actions/appointments";
import type { AppointmentActionState } from "@/lib/validation/appointments";

const INITIAL_STATE: AppointmentActionState = { status: "idle" };

const inputClasses =
  "mt-1.5 block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none transition-colors focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light";

/** UC-10 · FR-16 — pick a new free slot for an existing appointment. */
export function AppointmentRescheduleForm({
  id,
  staffId,
  currentIso,
  currentReason,
}: {
  id: string;
  staffId: string;
  currentIso: string;
  currentReason: string;
}): React.ReactElement {
  const [state, formAction, pending] = useActionState(rescheduleAppointment, INITIAL_STATE);
  const [date, setDate] = useState(currentIso.slice(0, 10));
  const [slot, setSlot] = useState<string | null>(currentIso);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="dateTime" value={slot ?? ""} />

      {state.message && (
        <div
          role="alert"
          className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm"
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="rescheduleDate" className="block text-sm font-medium text-gray-700">
          New date
        </label>
        <input
          id="rescheduleDate"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSlot(null);
          }}
          className={`${inputClasses} sm:w-56`}
        />
      </div>

      <SlotPicker
        staffId={staffId}
        date={date}
        selected={slot}
        onSelect={setSlot}
        excludeIso={currentIso}
      />

      <div>
        <label htmlFor="rescheduleReason" className="block text-sm font-medium text-gray-700">
          Reason <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="rescheduleReason"
          name="reason"
          rows={2}
          defaultValue={currentReason}
          className={`${inputClasses} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={pending || slot === null}
        className="w-full rounded-sm bg-navy py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[180px]"
      >
        {pending ? "Rescheduling…" : "Confirm new time"}
      </button>
    </form>
  );
}