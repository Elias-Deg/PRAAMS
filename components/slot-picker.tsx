"use client";

import { useEffect, useState } from "react";

import { todayInAddis } from "@/lib/constants";

interface Slot {
  iso: string;
  label: string;
  available: boolean;
}

/**
 * FR-14 — fetches and renders the available slots for one (staff, date) pair.
 * Handles loading, the clinic-closed case, empty results, fetch errors and the
 * parent's reset when the appointment being rescheduled already owns a slot.
 */
export function SlotPicker({
  staffId,
  date,
  selected,
  onSelect,
  excludeIso,
}: {
  staffId: string;
  date: string;
  selected: string | null;
  onSelect: (iso: string) => void;
  /** While rescheduling, the appointment's current slot is not "taken". */
  excludeIso?: string | null;
}): React.ReactElement {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setError(null);

    const invalid =
      !/^[0-9a-f-]{36}$/i.test(staffId) || !/^\d{4}-\d{2}-\d{2}$/.test(date);
    if (invalid) {
      setSlots([]);
      return;
    }

    fetch(`/api/appointments/slots?staff=${staffId}&date=${date}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { slots: Slot[]; closed?: boolean };
      })
      .then((body) => {
        if (cancelled) return;
        setClosed(Boolean(body.closed));
        // While rescheduling, the appointment's own slot stays selectable
        // (the server-side clash check excludes it too).
        const normalized = body.slots.map((slot) => {
          if (excludeIso && Date.parse(slot.iso) === Date.parse(excludeIso)) {
            return { ...slot, available: Date.parse(slot.iso) > Date.now() };
          }
          return slot;
        });
        setSlots(normalized);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSlots([]);
        setError(err instanceof Error ? err.message : "Could not load slots.");
      });

    return () => {
      cancelled = true;
    };
  }, [staffId, date, excludeIso]);

  if (closed) {
    return (
      <p className="rounded-sm bg-gray-50 px-4 py-3 text-sm text-gray-500">
        The clinic is closed on {date} (Sundays). Pick another day.
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-sm border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-700">
        Could not load time slots. Please try again.
      </p>
    );
  }

  if (slots === null) {
    return (
      <p className="text-sm text-gray-500" aria-live="polite">
        Loading available slots…
      </p>
    );
  }

  const selectable = slots.filter((slot) => slot.available);
  if (selectable.length === 0) {
    return (
      <p className="rounded-sm bg-gray-50 px-4 py-3 text-sm text-gray-500">
        No free slots on {date}
        {date === todayInAddis() ? " (remaining today)" : ""}. Try another day.
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-wider text-navy">
        Available time slots
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = selected !== null && Date.parse(selected) === Date.parse(slot.iso);
          const enabled = slot.available || isSelected;
          return (
            <button
              key={slot.iso}
              type="button"
              disabled={!enabled}
              aria-pressed={isSelected}
              onClick={() => enabled && onSelect(slot.iso)}
              className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                isSelected
                  ? "border-navy bg-navy text-white"
                  : enabled
                    ? "border-navy-light bg-white text-navy hover:bg-navy-tint"
                    : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
              }`}
            >
              {slot.label}
              {!slot.available && !isSelected ? " (booked)" : ""}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {selectable.length} of {slots.length} slots free · 30-minute visits · 09:00–17:00
      </p>
    </fieldset>
  );
}