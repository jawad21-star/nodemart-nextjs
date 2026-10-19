import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { OrderActions } from "@/components/admin/order-actions";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { Badge, OrderStatusBadge } from "@/components/status-badge";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/config";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  const { number } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, number),
    with: { items: { with: { product: { columns: { id: true, image: true } } } }, user: { columns: { id: true, name: true, email: true } } },
  });
  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDate(order.createdAt, true)}`}
        crumbs={[{ href: "/admin/orders", label: "Orders" }]}
        actions={
          <>
            <OrderActions orderId={order.id} status={order.status} paid={order.paymentStatus === "paid"} />
            <Link href={`/admin/orders/${order.orderNumber}/edit`} className="btn-outline !rounded-lg">
              <Pencil className="size-4" /> Edit
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Items">
            <Table head={["Product", "Price", "Qty", "Total"]}>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="size-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50">
                        <ProductImage src={item.product?.image} alt={item.productName} className="size-full p-1" />
                      </div>
                      {item.product ? (
                        <Link href={`/admin/products/${item.product.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                          {item.productName}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{item.productName}</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{money(item.price)}</td>
                  <td>{item.quantity}</td>
                  <td className="font-semibold whitespace-nowrap">{money(item.total)}</td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Customer & shipping">
            <div className="grid gap-6 p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Contact</p>
                <p className="mt-2 font-medium text-slate-900">{order.customerName}</p>
                <p className="text-slate-600">{order.customerEmail}</p>
                <p className="text-slate-600">{order.customerPhone}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {order.user ? (
                    <>
                      Account:{" "}
                      <Link href={`/admin/customers/${order.user.id}`} className="font-semibold text-brand-600 hover:underline">
                        {order.user.name}
                      </Link>
                    </>
                  ) : (
                    "Guest checkout"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Shipping address</p>
                <p className="mt-2 text-slate-700">
                  {order.address}
                  <br />
                  {order.city} {order.postalCode}
                </p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Notes</p>
                  <p className="mt-2 rounded-lg bg-amber-50 p-3 text-slate-700">{order.notes}</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Order">
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <Row label="Status">
                <OrderStatusBadge status={order.status} />
              </Row>
              <Row label="Payment method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Row>
              <Row label="Payment">
                <Badge color={order.paymentStatus === "paid" ? "green" : "slate"}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge>
              </Row>
              <Row label="Last updated">{formatDate(order.updatedAt, true)}</Row>
            </dl>
          </Panel>
          <Panel title="Summary">
            <dl className="divide-y divide-slate-100 px-5 py-2">
              <Row label="Subtotal">{money(order.subtotal)}</Row>
              <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}>- {money(order.discount)}</Row>
              <Row label="Shipping">{order.shipping ? money(order.shipping) : "Free"}</Row>
              <div className="flex justify-between py-3 text-base font-bold text-slate-900">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
