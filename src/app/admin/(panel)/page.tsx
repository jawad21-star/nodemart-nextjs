import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { orderItems, orders, products, users } from "@/db/schema";
import { SalesChart } from "@/components/admin/sales-chart";
import { PageHeader, Panel, StatCard, Table } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { Badge, OrderStatusBadge } from "@/components/status-badge";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function DashboardPage() {
  await connection();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const chartStart = startOfDay(new Date(now.getTime() - 29 * DAY));
  const notCancelled = ne(orders.status, "cancelled");

  const revenue = (from: Date, to?: Date) =>
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, from), to ? lt(orders.createdAt, to) : undefined))
      .then(([r]) => r.total);

  const [thisMonth, lastMonth, orderCount, pending, customers, newCustomers, productCount, lowStock, daily, latest, bestSellers] = await Promise.all([
    revenue(monthStart),
    revenue(lastMonthStart, monthStart),
    db.$count(orders),
    db.$count(orders, eq(orders.status, "pending")),
    db.$count(users, eq(users.isAdmin, false)),
    db.$count(users, and(eq(users.isAdmin, false), gte(users.createdAt, new Date(now.getTime() - 30 * DAY)))),
    db.$count(products, eq(products.isActive, true)),
    db.$count(products, lt(products.stock, 5)),
    db
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${orders.createdAt}, 'unixepoch', 'localtime')`,
        revenue: sql<number>`sum(${orders.total})`,
        orders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, chartStart)))
      .groupBy(sql`1`),
    db.query.orders.findMany({ orderBy: desc(orders.createdAt), limit: 8 }),
    db
      .select({
        id: products.id,
        name: products.name,
        image: products.image,
        stock: products.stock,
        sold: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`sum(${orderItems.total})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(products.id, orderItems.productId))
      .groupBy(products.id)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const chart = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(chartStart.getTime() + i * DAY);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const row = byDay.get(key);
    return { label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });

  const change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return (
    <>
      <PageHeader title="Dashboard" description={`Here's what's happening in your store — ${formatDate(now)}.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (this month)"
          value={money(thisMonth)}
          hint={change === null ? "No sales last month" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs last month`}
          tone={change !== null && change < 0 ? "red" : "green"}
        />
        <StatCard label="Orders" value={orderCount} hint={`${pending} pending`} tone="amber" />
        <StatCard label="Customers" value={customers} hint={`${newCustomers} new in 30 days`} tone="brand" />
        <StatCard label="Active products" value={productCount} hint={`${lowStock} low on stock`} tone="red" />
      </div>

      <Panel title="Sales overview" className="mt-6">
        <SalesChart data={chart} />
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Panel
          title="Latest orders"
          className="xl:col-span-3"
          actions={
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          }
        >
          <Table head={["Order", "Customer", "Total", "Status", "Date"]}>
            {latest.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold whitespace-nowrap text-slate-900 hover:text-brand-600">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="whitespace-nowrap">{o.customerName}</td>
                <td className="font-medium whitespace-nowrap">{money(o.total)}</td>
                <td>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="whitespace-nowrap text-slate-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Best sellers" className="xl:col-span-2">
          <ul className="divide-y divide-slate-100">
            {bestSellers.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="size-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50">
                  <ProductImage src={p.image} alt={p.name} className="size-full p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-brand-600">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {p.sold} sold · {money(p.revenue)}
                  </p>
                </div>
                <Badge color={p.stock < 5 ? "red" : "green"}>{p.stock} left</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
