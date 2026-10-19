"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { formValues, optionalText, validationFailed, type FormState } from "@/lib/form";
import { createSession, deleteSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.email("Enter a valid email.").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

async function attemptLogin(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { state: validationFailed(parsed.error, formData) };

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return { state: { error: "These credentials do not match our records.", values: { email: parsed.data.email } } };
  }
  return { user };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, state } = await attemptLogin(formData);
  if (!user) return state!;

  await createSession({ userId: user.id, isAdmin: user.isAdmin });
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, state } = await attemptLogin(formData);
  if (!user) return state!;
  if (!user.isAdmin) return { error: "This account does not have admin access.", values: formValues(formData) };

  await createSession({ userId: user.id, isAdmin: true });
  redirect("/admin");
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(255),
    email: z.email("Enter a valid email.").max(255).transform((v) => v.toLowerCase()),
    phone: optionalText(30),
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, { path: ["password"], message: "Passwords do not match." });

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);

  const exists = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email), columns: { id: true } });
  if (exists) {
    return { fieldErrors: { email: ["An account with this email already exists."] }, values: formValues(formData) };
  }

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    })
    .returning();

  await createSession({ userId: user.id, isAdmin: false });
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
