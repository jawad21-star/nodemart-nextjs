"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  brands,
  categories,
  coupons,
  ORDER_STATUSES,
  orders,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  products,
  reviews,
  users,
  type OrderStatus,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { checkbox, formValues, optionalInt, optionalText, validationFailed, type FormState } from "@/lib/form";
import { slugify } from "@/lib/format";
import { setOrderStatus } from "@/lib/orders";
import { saveImage } from "@/lib/uploads";

/** Every admin action re-checks the session against the database. */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/admin/login");
  return user;
}

function uniqueError(error: unknown, field: string, message: string): FormState | null {
  if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message + String(error.cause ?? ""))) {
    return { fieldErrors: { [field]: [message] } };
  }
  return null;
}

/* ───────────────────────── Products ───────────────────────── */

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a product name.").max(255),
    slug: optionalText(255),
    sku: optionalText(100),
    shortDescription: optionalText(500),
    description: optionalText(20000),
    price: z.coerce.number().int("Use whole rupees.").min(0, "Price can't be negative."),
    comparePrice: optionalInt(),
    stock: z.coerce.number().int().min(0, "Stock can't be negative."),
    categoryId: z.coerce.number().int().positive("Choose a category."),
    brandId: optionalInt(),
    imageUrl: optionalText(1000),
    isActive: checkbox(),
    isFeatured: checkbox(),
  })
  .refine((d) => d.comparePrice === undefined || d.comparePrice > d.price, {
    path: ["comparePrice"],
    message: "Compare-at price must be higher than the price.",
  });

export async function saveProduct(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);
  const d = parsed.data;

  let image: string | null;
  let newGallery: string[];
  try {
    image = (await saveImage(formData.get("imageFile"), "products")) ?? d.imageUrl ?? null;
    newGallery = (await Promise.all(formData.getAll("galleryFiles").map((f) => saveImage(f, "products")))).filter((v): v is string => !!v);
  } catch (error) {
    return { error: (error as Error).message, values: formValues(formData) };
  }

  const keptGallery = formData.getAll("keepGallery").map(String);

  const values = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    sku: d.sku ?? null,
    shortDescription: d.shortDescription ?? null,
    description: d.description ?? null,
    price: d.price,
    comparePrice: d.comparePrice ?? null,
    stock: d.stock,
    categoryId: d.categoryId,
    brandId: d.brandId || null,
    image,
    gallery: [...keptGallery, ...newGallery].slice(0, 8),
    isActive: d.isActive,
    isFeatured: d.isFeatured,
    updatedAt: new Date(),
  };

  try {
    if (id) await db.update(products).set(values).where(eq(products.id, id));
    else await db.insert(products).values(values);
  } catch (error) {
    const state = uniqueError(error, String(error).includes("sku") ? "sku" : "slug", "This value is already used by another product.");
    if (state) return { ...state, values: formValues(formData) };
    throw error;
  }

  updateTag(CATALOG_TAG);
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(id: number): Promise<void> {
  await assertAdmin();
  await db.delete(products).where(eq(products.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

export async function setProductFlag(id: number, flag: "isActive" | "isFeatured", value: boolean): Promise<void> {
  await assertAdmin();
  await db.update(products).set({ [flag]: value, updatedAt: new Date() }).where(eq(products.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

/* ───────────────────────── Categories & brands ───────────────────────── */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(255),
  slug: optionalText(255),
  description: optionalText(2000),
  imageUrl: optionalText(1000),
  sortOrder: z.coerce.number().int().default(0),
  isActive: checkbox(),
});

export async function saveCategory(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);
  const d = parsed.data;

  let image: string | null;
  try {
    image = (await saveImage(formData.get("imageFile"), "categories")) ?? d.imageUrl ?? null;
  } catch (error) {
    return { error: (error as Error).message, values: formValues(formData) };
  }

  const values = { name: d.name, slug: slugify(d.slug || d.name), description: d.description ?? null, image, sortOrder: d.sortOrder, isActive: d.isActive, updatedAt: new Date() };

  try {
    if (id) await db.update(categories).set(values).where(eq(categories.id, id));
    else await db.insert(categories).values(values);
  } catch (error) {
    const state = uniqueError(error, "slug", "Another category already uses this slug.");
    if (state) return { ...state, values: formValues(formData) };
    throw error;
  }

  updateTag(CATALOG_TAG);
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: number): Promise<void> {
  await assertAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

const brandSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(255),
  slug: optionalText(255),
  isActive: checkbox(),
});

export async function saveBrand(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);

  const values = { name: parsed.data.name, slug: slugify(parsed.data.slug || parsed.data.name), isActive: parsed.data.isActive, updatedAt: new Date() };
  try {
    if (id) await db.update(brands).set(values).where(eq(brands.id, id));
    else await db.insert(brands).values(values);
  } catch (error) {
    const state = uniqueError(error, "slug", "Another brand already uses this slug.");
    if (state) return { ...state, values: formValues(formData) };
    throw error;
  }

  updateTag(CATALOG_TAG);
  redirect("/admin/brands?saved=1");
}

export async function deleteBrand(id: number): Promise<void> {
  await assertAdmin();
  await db.delete(brands).where(eq(brands.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

/* ───────────────────────── Orders ───────────────────────── */

export async function changeOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await assertAdmin();
  if (!ORDER_STATUSES.includes(status)) return;
  await setOrderStatus(id, status);
  updateTag(CATALOG_TAG); // stock may have changed
  refresh();
}

export async function markOrderPaid(id: number): Promise<void> {
  await assertAdmin();
  await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, id));
  refresh();
}

const orderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  customerName: z.string().trim().min(2).max(255),
  customerEmail: z.email().max(255),
  customerPhone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(3).max(255),
  city: z.string().trim().min(2).max(100),
  postalCode: optionalText(20),
  notes: optionalText(1000),
});

export async function saveOrder(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);
  const { status, ...rest } = parsed.data;

  await db
    .update(orders)
    .set({ ...rest, postalCode: rest.postalCode ?? null, notes: rest.notes ?? null, updatedAt: new Date() })
    .where(eq(orders.id, id));
  await setOrderStatus(id, status);

  updateTag(CATALOG_TAG);
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id), columns: { orderNumber: true } });
  redirect(`/admin/orders/${order!.orderNumber}?saved=1`);
}

/* ───────────────────────── Coupons ───────────────────────── */

const couponSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters.").max(50).transform((v) => v.toUpperCase()),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().positive("Enter a discount value."),
    minAmount: optionalInt(),
    maxUses: optionalInt(),
    expiresAt: optionalText(30),
    isActive: checkbox(),
  })
  .refine((d) => d.type !== "percent" || d.value <= 100, { path: ["value"], message: "A percentage can't exceed 100." });

export async function saveCoupon(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);
  const d = parsed.data;

  const values = {
    code: d.code,
    type: d.type,
    value: d.value,
    minAmount: d.minAmount ?? null,
    maxUses: d.maxUses ?? null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    isActive: d.isActive,
    updatedAt: new Date(),
  };

  try {
    if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
    else await db.insert(coupons).values(values);
  } catch (error) {
    const state = uniqueError(error, "code", "This code already exists.");
    if (state) return { ...state, values: formValues(formData) };
    throw error;
  }

  redirect("/admin/coupons?saved=1");
}

export async function deleteCoupon(id: number): Promise<void> {
  await assertAdmin();
  await db.delete(coupons).where(eq(coupons.id, id));
  refresh();
}

export async function setCouponActive(id: number, isActive: boolean): Promise<void> {
  await assertAdmin();
  await db.update(coupons).set({ isActive }).where(eq(coupons.id, id));
  refresh();
}

/* ───────────────────────── Reviews ───────────────────────── */

export async function setReviewApproved(id: number, isApproved: boolean): Promise<void> {
  await assertAdmin();
  await db.update(reviews).set({ isApproved, updatedAt: new Date() }).where(eq(reviews.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

export async function deleteReview(id: number): Promise<void> {
  await assertAdmin();
  await db.delete(reviews).where(eq(reviews.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

/* ───────────────────────── Customers ───────────────────────── */

const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(255),
  email: z.email("Enter a valid email.").max(255).transform((v) => v.toLowerCase()),
  phone: optionalText(30),
  address: optionalText(255),
  city: optionalText(100),
  password: optionalText(255),
  isAdmin: checkbox(),
});

export async function saveCustomer(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await assertAdmin();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailed(parsed.error, formData);
  const d = parsed.data;

  if (!id && !d.password) return { fieldErrors: { password: ["Set a password for the new account."] }, values: formValues(formData) };
  if (d.password && d.password.length < 8) return { fieldErrors: { password: ["Password must be at least 8 characters."] }, values: formValues(formData) };
  if (id === admin.id && !d.isAdmin) return { fieldErrors: { isAdmin: ["You can't remove your own admin access."] }, values: formValues(formData) };

  const taken = await db.query.users.findFirst({ where: and(eq(users.email, d.email), id ? ne(users.id, id) : undefined), columns: { id: true } });
  if (taken) return { fieldErrors: { email: ["Another account uses this email."] }, values: formValues(formData) };

  const values = {
    name: d.name,
    email: d.email,
    phone: d.phone ?? null,
    address: d.address ?? null,
    city: d.city ?? null,
    isAdmin: d.isAdmin,
    updatedAt: new Date(),
    ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
  };

  if (id) await db.update(users).set(values).where(eq(users.id, id));
  else await db.insert(users).values({ ...values, passwordHash: values.passwordHash! });

  redirect("/admin/customers?saved=1");
}

export async function deleteCustomer(id: number): Promise<void> {
  const admin = await assertAdmin();
  if (id === admin.id) return;
  await db.delete(users).where(eq(users.id, id));
  refresh();
}
