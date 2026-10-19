"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons, products } from "@/db/schema";
import { getCartSummary, readCart, writeCart } from "@/lib/cart";
import { couponError } from "@/lib/coupons";
import type { FormState } from "@/lib/form";

export type AddToCartResult = { ok: boolean; message: string; count?: number };

export async function addToCart(productId: number, quantity = 1): Promise<AddToCartResult> {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product || !product.isActive) return { ok: false, message: "This product is no longer available." };
  if (product.stock < 1) return { ok: false, message: "Sorry, this product is out of stock." };

  const cart = await readCart();
  const current = cart.items[productId] ?? 0;
  const next = Math.min(current + Math.max(1, Math.floor(quantity)), product.stock);
  cart.items[productId] = next;
  await writeCart(cart);

  const count = Object.values(cart.items).reduce((s, q) => s + q, 0);
  if (next === current) return { ok: false, message: `Only ${product.stock} in stock — your cart already has them all.`, count };
  return { ok: true, message: `${product.name} added to cart.`, count };
}

export async function updateCartItem(productId: number, quantity: number): Promise<void> {
  const cart = await readCart();
  if (quantity <= 0) {
    delete cart.items[productId];
  } else {
    const product = await db.query.products.findFirst({ where: eq(products.id, productId), columns: { stock: true } });
    const qty = Math.min(Math.floor(quantity), product?.stock ?? 0);
    if (qty > 0) cart.items[productId] = qty;
    else delete cart.items[productId];
  }
  await writeCart(cart);
}

export async function removeCartItem(productId: number): Promise<void> {
  await updateCartItem(productId, 0);
}

export async function applyCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Enter a coupon code." };

  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, code) });
  if (!coupon) return { error: "Invalid coupon code.", values: { code } };

  const { subtotal } = await getCartSummary();
  const error = couponError(coupon, subtotal);
  if (error) return { error, values: { code } };

  const cart = await readCart();
  await writeCart({ ...cart, coupon: coupon.code });
  return { ok: true, message: `Coupon ${coupon.code} applied.` };
}

export async function removeCoupon(): Promise<void> {
  const cart = await readCart();
  await writeCart({ items: cart.items });
}
