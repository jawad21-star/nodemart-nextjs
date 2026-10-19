"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/account";
import { Field, SubmitButton, useFormToast } from "@/components/form";
import type { FormState } from "@/lib/form";

type Profile = { name: string; phone: string | null; address: string | null; city: string | null };

export function ProfileForm({ user }: { user: Profile }) {
  const [state, action] = useActionState(updateProfile, {} as FormState);
  useFormToast(state);

  return (
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="name" state={state} defaultValue={user.name} required />
      <Field label="Phone" name="phone" type="tel" state={state} defaultValue={user.phone} />
      <Field label="Address" name="address" state={state} defaultValue={user.address} />
      <Field label="City" name="city" state={state} defaultValue={user.city} />
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
