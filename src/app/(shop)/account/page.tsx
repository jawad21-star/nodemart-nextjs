import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { orderItems, orders } from "@/db/schema";
import { ProfileForm } from "@/components/account/profile-form";
import { OrderStatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "My account" };

// Per-user page: always rendered for the signed-in customer.
export const instant = false;

export default async function AccountPage() {
  const user = await requireUser();
  const myOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      total: orders.total,
      status: orders.status,
      itemCount: sql<number>`(select count(*) from ${orderItems} where ${qualified(orderItems.orderId)} = ${qualified(orders.id)})`,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-bold text-slate-900">Order history</h2>
        </div>
        {myOrders.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-slate-500">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn-primary mt-5">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-mono font-semibold whitespace-nowrap text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDate(o.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-500">{o.itemCount}</td>
                    <td className="px-6 py-4 font-semibold whitespace-nowrap text-slate-900">{money(o.total)}</td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/account/orders/${o.orderNumber}`} className="font-semibold whitespace-nowrap text-brand-600 hover:text-brand-700">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-bold text-slate-900">Profile & default address</h2>
        <ProfileForm user={user} />
      </section>
    </div>
  );
}
