"use client";

import { Loader2, Minus, Plus, Tag, Trash2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import { applyCoupon, removeCartItem, removeCoupon, updateCartItem } from "@/actions/cart";
import { SubmitButton, useFormToast } from "@/components/form";
import type { FormState } from "@/lib/form";

export function QuantityControl({ productId, quantity, max }: { productId: number; quantity: number; max: number }) {
  const [pending, start] = useTransition();
  const set = (q: number) => start(() => updateCartItem(productId, q));

  return (
    <div className="flex items-center rounded-full border border-slate-300">
      <button type="button" disabled={pending} onClick={() => set(quantity - 1)} className="flex size-9 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-40" aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className="flex w-8 justify-center text-sm font-semibold">{pending ? <Loader2 className="size-4 animate-spin" /> : quantity}</span>
      <button type="button" disabled={pending || quantity >= max} onClick={() => set(quantity + 1)} className="flex size-9 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30" aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function RemoveItemButton({ productId }: { productId: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => removeCartItem(productId))} className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50">
      <Trash2 className="size-4" /> Remove
    </button>
  );
}

export function CouponForm({ code, error }: { code: string | null; error: string | null }) {
  const [state, action] = useActionState(applyCoupon, {} as FormState);
  const [removing, start] = useTransition();
  useFormToast(state);

  if (code) {
    return (
      <div>
        <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Tag className="size-4" /> {code}
          </p>
          <button type="button" disabled={removing} onClick={() => start(() => removeCoupon())} className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-rose-600">
            Remove
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-amber-600">{error}</p>}
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="flex gap-2">
        <input name="code" defaultValue={state.values?.code} placeholder="Coupon code" aria-label="Coupon code" className="input !rounded-full uppercase" />
        <SubmitButton className="btn-outline shrink-0">Apply</SubmitButton>
      </div>
      {state.error && <p className="mt-2 text-xs text-rose-600">{state.error}</p>}
    </form>
  );
}
