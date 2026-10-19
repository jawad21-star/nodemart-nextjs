"use client";

import { useActionState } from "react";
import { saveOrder } from "@/actions/admin";
import { Field, SelectField, SubmitButton, TextArea, useFormToast } from "@/components/form";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, type Order } from "@/db/schema";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/config";
import type { FormState } from "@/lib/form";
import { Section } from "./product-form";

export function OrderForm({ order }: { order: Order }) {
  const [state, action] = useActionState(saveOrder.bind(null, order.id), {} as FormState);
  useFormToast(state);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <Section title="Customer & shipping" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="customerName" state={state} defaultValue={order.customerName} required />
          <Field label="Email" name="customerEmail" type="email" state={state} defaultValue={order.customerEmail} required />
          <Field label="Phone" name="customerPhone" state={state} defaultValue={order.customerPhone} required />
          <Field label="City" name="city" state={state} defaultValue={order.city} required />
          <Field label="Address" name="address" state={state} defaultValue={order.address} required className="sm:col-span-2" />
          <Field label="Postal code" name="postalCode" state={state} defaultValue={order.postalCode} />
        </div>
        <TextArea label="Notes" name="notes" state={state} defaultValue={order.notes} />
      </Section>
      <div className="space-y-6">
        <Section title="Status">
          <SelectField label="Order status" name="status" state={state} defaultValue={order.status} options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))} />
          <SelectField label="Payment status" name="paymentStatus" state={state} defaultValue={order.paymentStatus} options={PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] }))} />
          <SelectField label="Payment method" name="paymentMethod" state={state} defaultValue={order.paymentMethod} options={PAYMENT_METHODS.map((s) => ({ value: s, label: PAYMENT_METHOD_LABELS[s] }))} />
        </Section>
        <SubmitButton className="btn-brand w-full !rounded-xl !py-3" pendingText="Saving…">
          Save order
        </SubmitButton>
      </div>
    </form>
  );
}
