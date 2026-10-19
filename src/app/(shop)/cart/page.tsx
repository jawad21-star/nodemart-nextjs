import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductImage } from "@/components/product-image";
import { CouponForm, QuantityControl, RemoveItemButton } from "@/components/shop/cart-controls";
import { OrderSummary } from "@/components/shop/order-summary";
import { getCartSummary } from "@/lib/cart";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Shopping cart" };

async function CartView() {
  const cart = await getCartSummary();

  if (cart.lines.length === 0) {
    return (
      <div className="card mt-8 flex flex-col items-center px-6 py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <ShoppingBag className="size-9" />
        </span>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-500">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className="btn-primary mt-8 !px-8 !py-3">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {cart.lines.map(({ product, quantity, total }) => (
            <li key={product.id} className="flex gap-4 py-6 sm:gap-6">
              <Link href={`/product/${product.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:size-28">
                <ProductImage src={product.image} alt={product.name} className="size-full p-2" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/product/${product.slug}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-brand-600">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{money(product.price)} each</p>
                    {quantity > product.stock && <p className="mt-1 text-xs font-medium text-amber-600">Only {product.stock} left in stock</p>}
                  </div>
                  <p className="font-bold whitespace-nowrap text-slate-900">{money(total)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityControl productId={product.id} quantity={quantity} max={product.stock} />
                  <RemoveItemButton productId={product.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Continue shopping
        </Link>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="card bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
          <div className="mt-5">
            <CouponForm code={cart.coupon?.code ?? null} error={cart.couponError} />
          </div>
          <div className="mt-6">
            <OrderSummary cart={cart} />
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full !py-3.5">
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="size-4" /> Secure checkout
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="container-shop py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Shopping cart</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100" />}>
        <CartView />
      </Suspense>
    </div>
  );
}
