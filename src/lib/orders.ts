import "server-only";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, type OrderStatus } from "@/db/schema";

/**
 * Changes an order's status. Stock is returned when an order is cancelled
 * and taken again if a cancelled order is re-opened.
 */
export async function setOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order || order.status === status) return;

    const wasCancelled = order.status === "cancelled";
    const isCancelled = status === "cancelled";

    if (wasCancelled !== isCancelled) {
      const items = await tx.select().from(orderItems).where(and(eq(orderItems.orderId, orderId), isNotNull(orderItems.productId)));
      for (const item of items) {
        if (isCancelled) {
          await tx.update(products).set({ stock: sql`${products.stock} + ${item.quantity}` }).where(eq(products.id, item.productId!));
        } else {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(and(eq(products.id, item.productId!), gte(products.stock, item.quantity)));
        }
      }
    }

    await tx.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
  });
}

export function newOrderNumber(date = new Date()): string {
  const ymd = date.toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, "X");
  return `ORD-${ymd}-${suffix}`;
}
