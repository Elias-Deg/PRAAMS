import { z } from "zod";

/** Shared validation for UC-02 staff account forms (client + server). */

export const PHONE_REGEX = /^\+?[0-9 ()\-]{7,20}$/;

export const StaffFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { error: "Enter the full name (at least 3 characters)." })
    .max(80, { error: "Name must be 80 characters or fewer." }),
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase().max(254),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, {
      error: "Phone looks invalid — digits, spaces, dashes, parentheses, optional +.",
    })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  role: z.enum(["receptionist", "healthcare_professional", "administrator"], {
    error: "Choose a role.",
  }),
});

export const StaffCreateSchema = StaffFieldsSchema.extend({
  // Initial temporary credentials handed to the staff member in person.
  password: z
    .string()
    .min(8, { error: "Be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { error: "Contain at least one symbol." })
    .trim(),
});

export const StaffUpdateSchema = StaffFieldsSchema.pick({
  fullName: true,
  phone: true,
  role: true,
});

export const StaffIdSchema = z.uuid({ error: "Invalid staff reference." });

export interface StaffActionState {
  status: "idle" | "field-error" | "failed" | "saved";
  values?: Record<string, string>;
  fieldErrors?: Record<string, string>;
  /** Populated on non-field failures (duplicate email, server errors…). */
  message?: string;
}