import { and, eq } from "drizzle-orm";
import { Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ProductImage } from "@/components/product-image";
import { OrderStatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/config";
import { formatDate, money } from "@/lib/format";

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

// Per-user page: always rendered for the signed-in customer.
export const instant = false;

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[number]">) {
  const user = await requireUser();
  const { number } = await params;
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.orderNumber, number), eq(orders.userId, user.id)),
    with: { items: { with: { product: { columns: { slug: true, image: true } } } } },
  });
  if (!order) notFound();

  const current = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div>
      <Link href="/account" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-extrabold text-slate-900">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-slate-500">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {current >= 0 && (
        <ol className="card mt-8 grid grid-cols-4 p-6">
          {STEPS.map((step, i) => (
            <li key={step} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= current ? "bg-brand-600" : "bg-slate-200"}`} />}
              <span className={`relative flex size-8 items-center justify-center rounded-full text-xs font-bold ${i <= current ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                {i < current ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`mt-2 text-xs font-medium sm:text-sm ${i <= current ? "text-slate-900" : "text-slate-400"}`}>{ORDER_STATUS_LABELS[step]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h3 className="font-bold text-slate-900">Items</h3>
          <ul className="mt-4 divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="size-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50">
                  <ProductImage src={item.product?.image} alt={item.productName} className="size-full p-1.5" />
                </div>
                <div className="min-w-0 flex-1">
                  {item.product ? (
                    <Link href={`/product/${item.product.slug}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="font-medium text-slate-900">{item.productName}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {money(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap text-slate-900">{money(item.total)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-900">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
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
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="card p-6 text-sm">
            <h3 className="font-bold text-slate-900">Delivery</h3>
            <p className="mt-3 text-slate-600">
              {order.customerName}
              <br />
              {order.address}
              <br />
              {order.city} {order.postalCode}
              <br />
              {order.customerPhone}
            </p>
            <h3 className="mt-5 font-bold text-slate-900">Payment</h3>
            <p className="mt-2 text-slate-600">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
