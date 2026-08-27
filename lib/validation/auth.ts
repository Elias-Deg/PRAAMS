import { z } from "zod";

/** Shared between the login form (client) and the signIn server action (server). */
export const LoginFormSchema = z.object({
  email: z
    .email({ error: "Enter a valid email address." })
    .trim()
    .max(254),
  password: z.string().min(1, { error: "Enter your password." }),
});

export type LoginFields = z.infer<typeof LoginFormSchema>;

export type FieldErrors = Partial<Record<"email" | "password", string>>;

/**
 * State shape exchanged between the signIn Server Action and the login form
 * via useActionState. `_form` holds non-field errors (invalid credentials,
 * lockout notices, deactivated accounts).
 */
export interface LoginActionState {
  status: "idle" | "field-error" | "rejected" | "locked";
  values?: Pick<LoginFields, "email">;
  fieldErrors?: FieldErrors;
  /** Non-field message shown in the alert banner. */
  message?: string;
}

/** Formats a UTC ISO lockout instant as HH:mm (Addis Ababa time). */
export function formatLockoutUntil(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(iso)) + " East Africa Time";
}