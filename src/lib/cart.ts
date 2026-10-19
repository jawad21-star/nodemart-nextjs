import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { db } from "@/db";
import { coupons, products, type Coupon, type Product } from "@/db/schema";
import { shop } from "./config";
import { couponDiscount, couponError } from "./coupons";

/**
 * Cookie-backed cart. The cookie only holds product ids and quantities;
 * prices and stock are always read fresh from the database.
 */
const COOKIE = "nm_cart";

export type CartCookie = { items: Record<string, number>; coupon?: string };

export type CartLine = { product: Product; quantity: number; total: number };

export type CartSummary = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  coupon: Coupon | null;
  couponError: string | null;
  discount: number;
  shipping: number;
  total: number;
};

export async function readCart(): Promise<CartCookie> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return { items: {} };

  try {
    const parsed = JSON.parse(raw) as CartCookie;
    const items: Record<string, number> = {};
    for (const [id, qty] of Object.entries(parsed.items ?? {})) {
      const n = Math.floor(Number(qty));
      if (Number(id) > 0 && n > 0) items[id] = Math.min(n, 99);
    }
    return { items, coupon: typeof parsed.coupon === "string" ? parsed.coupon : undefined };
  } catch {
    return { items: {} };
  }
}

export async function writeCart(cart: CartCookie): Promise<void> {
  const store = await cookies();
  if (Object.keys(cart.items).length === 0 && !cart.coupon) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function cartCount(): Promise<number> {
  const { items } = await readCart();
  return Object.values(items).reduce((sum, qty) => sum + qty, 0);
}

export async function getCartSummary(): Promise<CartSummary> {
  const cart = await readCart();
  await connection(); // coupon expiry compares against the current time
  const ids = Object.keys(cart.items).map(Number);

  const rows = ids.length
    ? await db.select().from(products).where(and(inArray(products.id, ids), eq(products.isActive, true)))
    : [];

  const lines = rows.map((product) => {
    const quantity = cart.items[product.id];
    return { product, quantity, total: product.price * quantity };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  const coupon = cart.coupon ? ((await db.query.coupons.findFirst({ where: eq(coupons.code, cart.coupon) })) ?? null) : null;
  const error = coupon ? couponError(coupon, subtotal) : null;
  const discount = coupon && !error ? couponDiscount(coupon, subtotal) : 0;
  const shipping = subtotal === 0 || subtotal >= shop.freeShippingOver ? 0 : shop.shippingFee;

  return {
    lines,
    count,
    subtotal,
    coupon,
    couponError: error,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount) + shipping,
  };
}
