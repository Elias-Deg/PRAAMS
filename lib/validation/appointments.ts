import { z } from "zod";

/** Shared validation for UC-09/10 appointment forms (client + server). */

export const ReasonSchema = z
  .string()
  .trim()
  .max(200, { error: "Keep the reason under 200 characters." })
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Slot instant as produced by the SlotPicker (`YYYY-MM-DDTHH:mm:ss+03:00`). */
const slotInstant = z
  .string()
  .min(1, { error: "Choose an available time slot." })
  .refine((v) => !Number.isNaN(Date.parse(v)), { error: "Invalid slot." })
  .refine((v) => Date.parse(v) > Date.now() - 60_000, {
    error: "Choose a slot in the future.",
  });

export const ScheduleSchema = z.object({
  patientId: z.uuid({ error: "Choose a patient." }),
  staffId: z.uuid({ error: "Choose a healthcare professional." }),
  dateTime: slotInstant,
  reason: ReasonSchema,
});

export const RescheduleSchema = z.object({
  id: z.uuid({ error: "Invalid appointment reference." }),
  dateTime: slotInstant,
  reason: ReasonSchema,
});

export const AppointmentIdSchema = z.uuid({ error: "Invalid appointment reference." });

export interface AppointmentActionState {
  status: "idle" | "field-error" | "failed";
  values?: Record<string, string>;
  fieldErrors?: Record<string, string>;
  message?: string;
}