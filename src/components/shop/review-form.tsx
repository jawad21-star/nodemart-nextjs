"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { submitReview } from "@/actions/account";
import { FieldError, SubmitButton, useFormToast } from "@/components/form";
import type { FormState } from "@/lib/form";

export function ReviewForm({ productId }: { productId: number }) {
  const [state, action] = useActionState(submitReview.bind(null, productId), {} as FormState);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  useFormToast(state);

  if (state.ok) {
    return <p className="card mt-8 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">{state.message}</p>;
  }

  return (
    <form action={action} className="card mt-8 space-y-4 p-5">
      <p className="font-semibold text-slate-900">Write a review</p>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} stars`} className="cursor-pointer">
            <Star className={clsx("size-7 transition", (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
          </button>
        ))}
      </div>
      <FieldError state={state} name="rating" />
      <textarea name="comment" rows={3} className="input" placeholder="Share your experience…" defaultValue={state.values?.comment} aria-label="Review" />
      <FieldError state={state} name="comment" />
      <SubmitButton className="btn-primary w-full" pendingText="Submitting…">
        Submit review
      </SubmitButton>
    </form>
  );
}
