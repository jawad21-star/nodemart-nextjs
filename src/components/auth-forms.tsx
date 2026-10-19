"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLogin, login, register } from "@/actions/auth";
import { Field, SubmitButton } from "@/components/form";
import type { FormState } from "@/lib/form";

function FormError({ state }: { state: FormState }) {
  if (!state.error || state.fieldErrors) return null;
  return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>;
}

export function LoginForm({ next, admin = false }: { next?: string; admin?: boolean }) {
  const [state, action] = useActionState(admin ? adminLogin : login, {} as FormState);

  return (
    <form action={action} className="card mt-8 space-y-5 p-8 shadow-xl shadow-slate-200/50">
      {next && <input type="hidden" name="next" value={next} />}
      <FormError state={state} />
      <Field label="Email" name="email" type="email" state={state} required autoFocus autoComplete="email" />
      <Field label="Password" name="password" type="password" state={{ ...state, values: undefined }} required autoComplete="current-password" />
      <SubmitButton className="btn-primary w-full !py-3" pendingText="Signing in…">
        Sign in
      </SubmitButton>
      {!admin && (
        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(register, {} as FormState);
  const noPasswords = { ...state, values: undefined };

  return (
    <form action={action} className="card mt-8 space-y-5 p-8 shadow-xl shadow-slate-200/50">
      {next && <input type="hidden" name="next" value={next} />}
      <FormError state={state} />
      <Field label="Full name" name="name" state={state} required autoFocus autoComplete="name" />
      <Field label="Email" name="email" type="email" state={state} required autoComplete="email" />
      <Field label="Phone (optional)" name="phone" type="tel" state={state} autoComplete="tel" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" name="password" type="password" state={noPasswords} required autoComplete="new-password" />
        <Field label="Confirm" name="password_confirmation" type="password" state={noPasswords} required autoComplete="new-password" />
      </div>
      <SubmitButton className="btn-primary w-full !py-3" pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
