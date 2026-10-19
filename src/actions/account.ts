"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { products, reviews, users, wishlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { optionalText, validationFailed, type FormState } from "@/lib/form";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(255),
  phone: optionalText(30),
  address: optionalText(255),
  city: optionalText(100),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);

  await db
    .update(users)
    .set({ name: parsed.data.name, phone: parsed.data.phone ?? null, address: parsed.data.address ?? null, city: parsed.data.city ?? null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  refresh();
  return { ok: true, message: "Profile updated." };
}

export type WishlistResult = { added: boolean } | { signIn: true };

export async function toggleWishlist(productId: number): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { signIn: true };

  const where = and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId));
  const existing = await db.query.wishlists.findFirst({ where });

  if (existing) {
    await db.delete(wishlists).where(where);
  } else {
    const product = await db.query.products.findFirst({ where: eq(products.id, productId), columns: { id: true } });
    if (!product) return { added: false };
    await db.insert(wishlists).values({ userId: user.id, productId });
  }

  refresh();
  return { added: !existing };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  comment: optionalText(2000),
});

export async function submitReview(productId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to write a review." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);

  await db
    .insert(reviews)
    .values({ productId, userId: user.id, rating: parsed.data.rating, comment: parsed.data.comment ?? null })
    .onConflictDoUpdate({
      target: [reviews.productId, reviews.userId],
      set: { rating: parsed.data.rating, comment: parsed.data.comment ?? null, isApproved: false, updatedAt: new Date() },
    });

  return { ok: true, message: "Thanks! Your review will appear once approved." };
}
