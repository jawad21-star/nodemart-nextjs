"use client";

import { useActionState, useState } from "react";
import { saveBrand, saveCategory, saveCoupon, saveCustomer } from "@/actions/admin";
import { Field, SubmitButton, TextArea, Toggle, useFormToast } from "@/components/form";
import { ProductImage } from "@/components/product-image";
import type { Brand, Category, Coupon } from "@/db/schema";
import { shop } from "@/lib/config";
import type { FormState } from "@/lib/form";
import { Section } from "./product-form";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategory.bind(null, category?.id ?? null), {} as FormState);
  const [preview, setPreview] = useState(category?.image ?? null);
  useFormToast(state);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <Section title="Category details" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" state={state} defaultValue={category?.name} required />
          <Field label="Slug" name="slug" state={state} defaultValue={category?.slug} placeholder="auto-generated-from-name" />
          <Field label="Sort order" name="sortOrder" type="number" state={state} defaultValue={category?.sortOrder ?? 0} />
        </div>
        <TextArea label="Description" name="description" state={state} defaultValue={category?.description} rows={4} />
      </Section>
      <div className="space-y-6">
        <Section title="Display">
          <div className="aspect-square w-full max-w-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <ProductImage src={preview} alt="Category image" className="size-full p-3" />
          </div>
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            aria-label="Upload image"
            onChange={(e) => e.target.files?.[0] && setPreview(URL.createObjectURL(e.target.files[0]))}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
          />
          <Field label="…or image URL" name="imageUrl" state={state} defaultValue={category?.image} onChange={(e) => setPreview(e.target.value || null)} />
          <Toggle label="Visible in store" name="isActive" state={state} defaultChecked={category?.isActive ?? true} />
        </Section>
        <SubmitButton className="btn-brand w-full !rounded-xl !py-3" pendingText="Saving…">
          {category ? "Save changes" : "Create category"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function BrandForm({ brand }: { brand?: Brand }) {
  const [state, action] = useActionState(saveBrand.bind(null, brand?.id ?? null), {} as FormState);
  useFormToast(state);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Section title="Brand details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" state={state} defaultValue={brand?.name} required />
          <Field label="Slug" name="slug" state={state} defaultValue={brand?.slug} placeholder="auto-generated-from-name" />
        </div>
        <Toggle label="Active" name="isActive" state={state} defaultChecked={brand?.isActive ?? true} />
      </Section>
      <SubmitButton className="btn-brand !rounded-xl" pendingText="Saving…">
        {brand ? "Save changes" : "Create brand"}
      </SubmitButton>
    </form>
  );
}

function toLocalInput(date: Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const [state, action] = useActionState(saveCoupon.bind(null, coupon?.id ?? null), {} as FormState);
  const [type, setType] = useState(coupon?.type ?? "percent");
  useFormToast(state);

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <Section title="Coupon">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" name="code" state={state} defaultValue={coupon?.code} required className="[&_input]:uppercase" />
          <div>
            <label className="label" htmlFor="type">
              Discount type
            </label>
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")} className="input">
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount ({shop.currency})</option>
            </select>
          </div>
          <Field label={type === "percent" ? "Discount (%)" : `Discount (${shop.currency})`} name="value" type="number" min={1} max={type === "percent" ? 100 : undefined} state={state} defaultValue={coupon?.value} required />
          <Field label={`Minimum order (${shop.currency})`} name="minAmount" type="number" min={0} state={state} defaultValue={coupon?.minAmount} hint="Leave empty for no minimum." />
          <Field label="Usage limit" name="maxUses" type="number" min={1} state={state} defaultValue={coupon?.maxUses} hint={coupon ? `Used ${coupon.usedCount} times so far. Empty = unlimited.` : "Empty = unlimited."} />
          <Field label="Expires at" name="expiresAt" type="datetime-local" state={state} defaultValue={toLocalInput(coupon?.expiresAt)} />
        </div>
        <Toggle label="Active" name="isActive" state={state} defaultChecked={coupon?.isActive ?? true} />
      </Section>
      <SubmitButton className="btn-brand !rounded-xl" pendingText="Saving…">
        {coupon ? "Save changes" : "Create coupon"}
      </SubmitButton>
    </form>
  );
}

type Customer = { id: number; name: string; email: string; phone: string | null; address: string | null; city: string | null; isAdmin: boolean };

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [state, action] = useActionState(saveCustomer.bind(null, customer?.id ?? null), {} as FormState);
  useFormToast(state);
  const noPassword = { ...state, values: state.values ? { ...state.values, password: "" } : undefined };

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <Section title="Account" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" state={state} defaultValue={customer?.name} required />
          <Field label="Email" name="email" type="email" state={state} defaultValue={customer?.email} required />
          <Field label="Phone" name="phone" type="tel" state={state} defaultValue={customer?.phone} />
          <Field label="City" name="city" state={state} defaultValue={customer?.city} />
          <Field label="Address" name="address" state={state} defaultValue={customer?.address} className="sm:col-span-2" />
        </div>
      </Section>
      <div className="space-y-6">
        <Section title="Access">
          <Field
            label="Password"
            name="password"
            type="password"
            state={noPassword}
            autoComplete="new-password"
            hint={customer ? "Leave blank to keep the current password." : "At least 8 characters."}
          />
          <Toggle label="Admin access" name="isAdmin" state={state} defaultChecked={customer?.isAdmin} hint="Can sign in to this admin panel." />
        </Section>
        <SubmitButton className="btn-brand w-full !rounded-xl !py-3" pendingText="Saving…">
          {customer ? "Save changes" : "Create customer"}
        </SubmitButton>
      </div>
    </form>
  );
}
