import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PAYMENT_METHOD_LABELS, shop } from "@/lib/config";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmed" };

async function Confirmation({ params }: { params: PageProps<"/order/[number]">["params"] }) {
  const { number } = await params;
  const [order, user, jar] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.orderNumber, number), with: { items: true } }),
    getCurrentUser(),
    cookies(),
  ]);

  // Only the buyer (by this browser's last order, or their account) may see it.
  const allowed = order && (jar.get("nm_last_order")?.value === order.orderNumber || (order.userId && order.userId === user?.id));
  if (!order || !allowed) notFound();

  return (
    <div className="container-shop max-w-3xl py-16">
      <div className="text-center">
        <span className="mx-auto flex size-20 animate-fade-up items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Thank you for your order!</h1>
        <p className="mt-2 text-slate-500">
          We&apos;ve received your order and will contact you at <strong className="text-slate-700">{order.customerPhone}</strong> to confirm.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm">
          Order number: <strong className="font-mono text-slate-900">{order.orderNumber}</strong>
        </p>
      </div>

      {order.paymentMethod === "bank" && (
        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">Bank transfer details</h2>
          <dl className="mt-3 grid gap-2 text-sm text-amber-900 sm:grid-cols-2">
            <div>
              <dt className="text-amber-700">Bank</dt>
              <dd className="font-medium">Meezan Bank</dd>
            </div>
            <div>
              <dt className="text-amber-700">Account title</dt>
              <dd className="font-medium">{shop.name}</dd>
            </div>
            <div>
              <dt className="text-amber-700">IBAN</dt>
              <dd className="font-mono font-medium">PK00 MEZN 0000 0000 0000 0000</dd>
            </div>
            <div>
              <dt className="text-amber-700">Reference</dt>
              <dd className="font-mono font-medium">{order.orderNumber}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-amber-700">Please use your order number as the payment reference.</p>
        </div>
      )}

      <div className="card mt-10 p-6">
        <h2 className="font-bold text-slate-900">Order details</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-slate-700">
                {item.productName} <span className="text-slate-400">× {item.quantity}</span>
              </span>
              <span className="font-medium whitespace-nowrap text-slate-900">{money(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>Discount ({order.couponCode})</dt>
              <dd>- {money(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Shipping</dt>
            <dd>{order.shipping > 0 ? money(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold text-slate-900">
            <dt>Total</dt>
            <dd>{money(order.total)}</dd>
          </div>
        </dl>
        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-900">Shipping to</p>
            <p className="mt-1 text-slate-600">
              {order.customerName}
              <br />
              {order.address}
              <br />
              {order.city} {order.postalCode}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Payment</p>
            <p className="mt-1 text-slate-600">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
        {user && (
          <Link href="/account" className="btn-outline">
            View my orders
          </Link>
        )}
      </div>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/order/[number]">) {
  return (
    <Suspense fallback={<div className="container-shop h-96 max-w-3xl animate-pulse py-16" />}>
      <Confirmation params={params} />
    </Suspense>
  );
}
