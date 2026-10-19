"use client";

import { Loader2, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";

type Props = { productId: number; quantity?: number; variant?: "icon" | "full"; label?: string };

export function AddToCartButton({ productId, quantity = 1, variant = "icon", label = "Add to cart" }: Props) {
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      if (result.ok) {
        toast.success(result.message, {
          action: (
            <Link href="/cart" className="ml-auto text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
              View cart
            </Link>
          ),
        });
      } else {
        toast.error(result.message);
      }
    });
  }

  if (variant === "full") {
    return (
      <button type="button" onClick={add} disabled={pending} className="btn-primary w-full !py-3.5">
        {pending ? <Loader2 className="size-5 animate-spin" /> : <ShoppingBag className="size-5" />}
        {pending ? "Adding…" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      aria-label={label}
      className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-brand-600 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
    </button>
  );
}
