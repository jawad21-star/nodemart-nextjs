"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { coupons, orderItems, orders, PAYMENT_METHODS, products, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { clearCart, getCartSummary } from "@/lib/cart";
import { CATALOG_TAG } from "@/lib/catalog";
import { optionalText, validationFailed, type FormState } from "@/lib/form";
import { newOrderNumber } from "@/lib/orders";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name.").max(255),
  customerEmail: z.email("Enter a valid email.").max(255),
  customerPhone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  address: z.string().trim().min(5, "Enter your street address.").max(255),
  city: z.string().trim().min(2, "Enter your city.").max(100),
  postalCode: optionalText(20),
  notes: optionalText(1000),
  paymentMethod: z.enum(PAYMENT_METHODS, "Choose a payment method."),
});

class StockError extends Error {}

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);

  const cart = await getCartSummary();
  if (cart.lines.length === 0) redirect("/cart");

  const user = await getCurrentUser();
  const data = parsed.data;
  const orderNumber = newOrderNumber();

  try {
    await db.transaction(async (tx) => {
      // Decrement stock only where enough is left, so two checkouts can't oversell.
      for (const line of cart.lines) {
        const result = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}` })
          .where(and(eq(products.id, line.product.id), gte(products.stock, line.quantity)));
        if (result.rowsAffected === 0) {
          throw new StockError(`Sorry, ${line.product.name} doesn't have enough stock left. Please update your cart.`);
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          ...data,
          orderNumber,
          userId: user?.id ?? null,
          postalCode: data.postalCode ?? null,
          notes: data.notes ?? null,
          subtotal: cart.subtotal,
          discount: cart.discount,
          shipping: cart.shipping,
          total: cart.total,
          couponCode: cart.discount > 0 ? cart.coupon!.code : null,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        cart.lines.map((line) => ({
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          price: line.product.price,
          quantity: line.quantity,
          total: line.total,
        })),
      );

      if (cart.discount > 0) {
        await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, cart.coupon!.id));
      }

      if (user && !user.phone) {
        await tx.update(users).set({ phone: data.customerPhone, address: data.address, city: data.city }).where(eq(users.id, user.id));
      }
    });
  } catch (error) {
    if (error instanceof StockError) return { error: error.message };
    throw error;
  }

  await clearCart();
  // Lets a guest open their confirmation page.
  (await cookies()).set("nm_last_order", orderNumber, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  updateTag(CATALOG_TAG); // stock changed

  redirect(`/order/${orderNumber}`);
}
