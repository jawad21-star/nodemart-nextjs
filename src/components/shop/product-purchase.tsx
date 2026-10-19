"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function ProductPurchase({ productId, stock, wishlist }: { productId: number; stock: number; wishlist?: ReactNode }) {
  const [qty, setQty] = useState(1);
  const [buying, startBuy] = useTransition();
  const router = useRouter();

  function buyNow() {
    startBuy(async () => {
      const result = await addToCart(productId, qty);
      if (result.ok || result.count) router.push("/checkout");
      else toast.error(result.message);
    });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-slate-300">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-12 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900" aria-label="Decrease quantity">
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            min={1}
            max={stock}
            value={qty}
            aria-label="Quantity"
            onChange={(e) => setQty(Math.min(stock, Math.max(1, Number(e.target.value) || 1)))}
            className="w-12 [appearance:textfield] border-0 bg-transparent text-center font-semibold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button type="button" onClick={() => setQty((q) => Math.min(stock, q + 1))} className="flex size-12 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900" aria-label="Increase quantity">
            <Plus className="size-4" />
          </button>
        </div>
        <div className="min-w-48 flex-1">
          <AddToCartButton productId={productId} quantity={qty} variant="full" />
        </div>
        {wishlist}
      </div>
      <button type="button" onClick={buyNow} disabled={buying} className="btn-brand mt-3 w-full !py-3.5">
        {buying && <Loader2 className="size-4 animate-spin" />} Buy it now
      </button>
    </div>
  );
}
