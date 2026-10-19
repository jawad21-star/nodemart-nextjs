import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductImage } from "@/components/product-image";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { OrderSummary } from "@/components/shop/order-summary";
import { getCurrentUser } from "@/lib/auth";
import { getCartSummary } from "@/lib/cart";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout" };

async function Checkout() {
  const [cart, user] = await Promise.all([getCartSummary(), getCurrentUser()]);
  if (cart.lines.length === 0) redirect("/cart");

  const summary = (
    <>
      <h2 className="text-lg font-bold text-slate-900">Your order</h2>
      <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pt-2 pr-1">
        {cart.lines.map(({ product, quantity, total }) => (
          <li key={product.id} className="flex items-center gap-3">
            <div className="relative size-16 shrink-0 rounded-xl border border-slate-200 bg-white">
              <ProductImage src={product.image} alt={product.name} className="size-full p-1.5" />
              <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white">{quantity}</span>
            </div>
            <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-700">{product.name}</p>
            <p className="text-sm font-semibold whitespace-nowrap text-slate-900">{money(total)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-slate-200 pt-6">
        <OrderSummary cart={cart} />
      </div>
    </>
  );

  return (
    <>
      {!user && (
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login?next=/checkout" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>{" "}
          for faster checkout.
        </p>
      )}
      <CheckoutForm
        defaults={{ name: user?.name, email: user?.email, phone: user?.phone, address: user?.address, city: user?.city }}
        summary={summary}
        totalLabel={money(cart.total)}
      />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div className="container-shop py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Checkout</h1>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}
