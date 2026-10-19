import { and, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";
import { Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { ORDER_STATUSES, orderItems, orders, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/db/schema";
import { FilterSelect, PageHeader, Panel, Table, Toolbar } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import { Badge, OrderStatusBadge } from "@/components/status-badge";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/config";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 15;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const q = str(params.q);
  const status = str(params.status);
  const payment = str(params.payment);
  const from = str(params.from);
  const to = str(params.to);
  const page = Math.max(1, Number(params.page) || 1);

  const where: (SQL | undefined)[] = [];
  if (q) {
    const term = `%${q}%`;
    where.push(or(like(orders.orderNumber, term), like(orders.customerName, term), like(orders.customerEmail, term), like(orders.customerPhone, term)));
  }
  if ((ORDER_STATUSES as readonly string[]).includes(status)) where.push(eq(orders.status, status as OrderStatus));
  if ((PAYMENT_STATUSES as readonly string[]).includes(payment)) where.push(eq(orders.paymentStatus, payment as PaymentStatus));
  if (from) where.push(gte(orders.createdAt, new Date(`${from}T00:00:00`)));
  if (to) where.push(lte(orders.createdAt, new Date(`${to}T23:59:59`)));
  const condition = and(...where);

  const [rows, total, counts] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        city: orders.city,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        itemCount: sql<number>`(select coalesce(sum(${qualified(orderItems.quantity)}), 0) from ${orderItems} where ${qualified(orderItems.orderId)} = ${qualified(orders.id)})`,
      })
      .from(orders)
      .where(condition)
      .orderBy(desc(orders.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.$count(orders, condition),
    db.select({ status: orders.status, count: sql<number>`count(*)` }).from(orders).groupBy(orders.status),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c.count]));

  return (
    <>
      <PageHeader title="Orders" description={`${total} orders`} />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ${!status ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ${status === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {ORDER_STATUS_LABELS[s]} <span className="ml-1 opacity-60">{countBy[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      <Panel>
        <Toolbar action="/admin/orders" q={q} placeholder="Order #, customer, email or phone…">
          {status && <input type="hidden" name="status" value={status} />}
          <FilterSelect name="payment" value={payment} label="Any payment" options={PAYMENT_STATUSES.map((p) => ({ value: p, label: PAYMENT_STATUS_LABELS[p] }))} />
          <input type="date" name="from" defaultValue={from} aria-label="From date" className="input !w-auto !rounded-lg !py-2" />
          <input type="date" name="to" defaultValue={to} aria-label="To date" className="input !w-auto !rounded-lg !py-2" />
        </Toolbar>
        <Table head={["Order", "Customer", "Items", "Total", "Payment", "Status", "Date", ""]} empty={rows.length === 0}>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold whitespace-nowrap text-slate-900 hover:text-brand-600">
                  {o.orderNumber}
                </Link>
              </td>
              <td>
                <p className="font-medium whitespace-nowrap text-slate-900">{o.customerName}</p>
                <p className="text-xs whitespace-nowrap text-slate-500">
                  {o.customerPhone} · {o.city}
                </p>
              </td>
              <td className="text-slate-500">{o.itemCount}</td>
              <td className="font-semibold whitespace-nowrap">{money(o.total)}</td>
              <td>
                <p className="text-xs whitespace-nowrap text-slate-500">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</p>
                <Badge color={o.paymentStatus === "paid" ? "green" : o.paymentStatus === "refunded" ? "amber" : "slate"}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</Badge>
              </td>
              <td>
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="text-xs whitespace-nowrap text-slate-500">{formatDate(o.createdAt, true)}</td>
              <td>
                <Link href={`/admin/orders/${o.orderNumber}`} className="btn-ghost !p-2" aria-label="View order" title="View">
                  <Eye className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </Table>
        <div className="pb-6">
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} params={params} basePath="/admin/orders" />
        </div>
      </Panel>
    </>
  );
}
