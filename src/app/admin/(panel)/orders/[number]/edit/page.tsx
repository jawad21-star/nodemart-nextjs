import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { OrderForm } from "@/components/admin/order-form";
import { PageHeader } from "@/components/admin/ui";

export default async function EditOrderPage({ params }: PageProps<"/admin/orders/[number]/edit">) {
  const { number } = await params;
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, number) });
  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${order.orderNumber}`}
        crumbs={[
          { href: "/admin/orders", label: "Orders" },
          { href: `/admin/orders/${order.orderNumber}`, label: order.orderNumber },
        ]}
      />
      <OrderForm order={order} />
    </>
  );
}
