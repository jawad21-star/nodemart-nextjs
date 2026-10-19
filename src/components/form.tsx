"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { FormState } from "@/lib/form";

export function SubmitButton({ children, pendingText, className = "btn-primary" }: { children: ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;
}

/** Shows the form-level error/success message from a Server Action as a toast. */
export function useFormToast(state: FormState) {
  const last = useRef<FormState | null>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.error) toast.error(state.error);
    else if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

type FieldProps = {
  label: string;
  name: string;
  state: FormState;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  className?: string;
} & Omit<ComponentProps<"input">, "name" | "defaultValue">;

/** Text-like input with label, server error and value kept after a failed submit. */
export function Field({ label, name, state, defaultValue, hint, className, ...props }: FieldProps) {
  const value = state.values?.[name] ?? defaultValue ?? "";
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} key={String(value)} defaultValue={value} className={clsx("input", state.fieldErrors?.[name] && "!border-rose-400")} {...props} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <FieldError state={state} name={name} />
    </div>
  );
}

export function TextArea({ label, name, state, defaultValue, rows = 3, className, placeholder }: { label: string; name: string; state: FormState; defaultValue?: string | null; rows?: number; className?: string; placeholder?: string }) {
  const value = state.values?.[name] ?? defaultValue ?? "";
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} rows={rows} key={value} defaultValue={value} placeholder={placeholder} className="input" />
      <FieldError state={state} name={name} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  state,
  defaultValue,
  options,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  state: FormState;
  defaultValue?: string | number | null;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  const value = state.values?.[name] ?? (defaultValue != null ? String(defaultValue) : "");
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} key={value} defaultValue={value} className="input">
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError state={state} name={name} />
    </div>
  );
}

export function Toggle({ label, name, state, defaultChecked, hint }: { label: string; name: string; state: FormState; defaultChecked?: boolean; hint?: string }) {
  const checked = state.values ? state.values[name] === "on" : !!defaultChecked;
  return (
    <div>
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-slate-700">{label}</span>
          {hint && <span className="block text-xs text-slate-500">{hint}</span>}
        </span>
        <input type="checkbox" name={name} key={String(checked)} defaultChecked={checked} className="peer sr-only" />
        <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
      </label>
      <FieldError state={state} name={name} />
    </div>
  );
}
