import { z } from "zod";

/** Shared validation for UC-04..08 patient demographics (client + server). */

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

const dobRule = z
  .string()
  .min(1, { error: "Enter the date of birth." })
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    error: "Enter a valid date.",
  })
  .refine((value) => new Date(value) <= new Date(), {
    error: "Date of birth cannot be in the future.",
  });

export const PatientFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { error: "Enter the full name (at least 3 characters)." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  dateOfBirth: dobRule,
  gender: z.enum(GENDERS, { error: "Choose a gender." }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()\-]{7,20}$/, {
      error: "Phone looks invalid — digits, spaces, dashes, parentheses, optional +.",
    })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: z.string().trim().max(200, { error: "Keep the address under 200 characters." })
    .optional().or(z.literal("").transform(() => undefined)),
  emergencyContact: z
    .string()
    .trim()
    .max(120, { error: "Keep the emergency contact under 120 characters." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/** Demographics editable after registration — identical surface, kept separate
 * semantically so UC-05 can drift without touching UC-04 rules. */
export const PatientUpdateSchema = PatientFieldsSchema;

export const PatientIdSchema = z.uuid({ error: "Invalid patient reference." });

export interface PatientActionState {
  status: "idle" | "field-error" | "failed" | "saved";
  values?: Record<string, string>;
  fieldErrors?: Record<string, string>;
  message?: string;
}

/** Clinical entry form (UC-07). */
export const MedicalRecordSchema = z.object({
  visitDate: z
    .string()
    .min(1, { error: "Enter the visit date and time." })
    .refine((v) => !Number.isNaN(new Date(v).getTime()), { error: "Invalid date." })
    .refine((v) => new Date(v) <= new Date(), {
      error: "The visit time cannot be in the future.",
    }),
  diagnosis: z
    .string()
    .trim()
    .min(3, { error: "Enter a diagnosis (at least 3 characters)." })
    .max(200, { error: "Keep the diagnosis under 200 characters." }),
  notes: z
    .string()
    .trim()
    .max(2000, { error: "Keep the notes under 2000 characters." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});