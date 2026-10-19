"use client";

import clsx from "clsx";
import { useActionState, useState, type ReactNode } from "react";
import { placeOrder } from "@/actions/checkout";
import { Field, SubmitButton, TextArea, useFormToast } from "@/components/form";
import { PAYMENT_METHOD_LABELS } from "@/lib/config";
import type { FormState } from "@/lib/form";

type Defaults = { name?: string; email?: string; phone?: string | null; address?: string | null; city?: string | null };

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Hyderabad"];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs text-white">{n}</span> {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function CheckoutForm({ defaults, summary, totalLabel }: { defaults: Defaults; summary: ReactNode; totalLabel: string }) {
  const [state, action] = useActionState(placeOrder, {} as FormState);
  const [payment, setPayment] = useState(state.values?.paymentMethod ?? "cod");
  useFormToast(state);

  return (
    <form action={action} className="mt-8 grid gap-10 lg:grid-cols-5">
      <div className="space-y-8 lg:col-span-3">
        <Step n={1} title="Contact information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Full name" name="customerName" state={state} defaultValue={defaults.name} required autoComplete="name" />
            <Field label="Email" name="customerEmail" type="email" state={state} defaultValue={defaults.email} required autoComplete="email" />
            <Field label="Phone" name="customerPhone" type="tel" state={state} defaultValue={defaults.phone} placeholder="03xx xxxxxxx" required autoComplete="tel" />
          </div>
        </Step>

        <Step n={2} title="Shipping address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Street address" name="address" state={state} defaultValue={defaults.address} placeholder="House #, street, area" required autoComplete="street-address" />
            <Field label="City" name="city" state={state} defaultValue={defaults.city} list="cities" required autoComplete="address-level2" />
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Field label="Postal code (optional)" name="postalCode" state={state} autoComplete="postal-code" />
            <TextArea className="sm:col-span-2" label="Order notes (optional)" name="notes" state={state} rows={2} placeholder="Delivery instructions, landmark…" />
          </div>
        </Step>

        <Step n={3} title="Payment method">
          <div className="space-y-3">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <label
                key={value}
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition",
                  payment === value ? "border-brand-600 bg-brand-50/50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <input type="radio" name="paymentMethod" value={value} checked={payment === value} onChange={() => setPayment(value)} className="mt-0.5 size-4 accent-brand-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {value === "cod" ? "Pay in cash when your order arrives." : "Transfer to our bank account. Details are shown after you place the order."}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Step>
      </div>

      <div className="lg:col-span-2">
        <div className="card bg-slate-50 p-6 lg:sticky lg:top-28">
          {summary}
          <SubmitButton className="btn-primary mt-6 w-full !py-3.5" pendingText="Placing order…">
            Place order · {totalLabel}
          </SubmitButton>
          <p className="mt-4 text-center text-xs text-slate-500">By placing your order you agree to our terms and return policy.</p>
        </div>
      </div>
    </form>
  );
}
