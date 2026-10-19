import { z } from "zod";

/** State shape returned by form Server Actions and consumed by useActionState. */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

export function validationFailed(error: z.ZodError, formData: FormData): FormState {
  return {
    error: "Please fix the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    values: formValues(formData),
  };
}

/** Empty strings from forms become undefined so optional fields validate cleanly. */
export const optionalText = (max = 255) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : typeof v === "string" ? v.trim() : v), z.string().max(max).optional());

export const optionalInt = () =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number().int().min(0).optional());

export const checkbox = () => z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean());
