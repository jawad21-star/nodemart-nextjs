import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, like, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { brands, categories, orderItems, products, reviews, users } from "@/db/schema";

/**
 * Public catalog reads. Everything here is cached and tagged "catalog";
 * admin edits and checkouts call updateTag("catalog") to refresh it.
 */
export const CATALOG_TAG = "catalog";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  image: string | null;
  categoryName: string | null;
  rating: number | null;
};

const ratings = db
  .select({
    productId: reviews.productId,
    rating: sql<number>`avg(${reviews.rating})`.as("rating"),
    reviewCount: sql<number>`count(*)`.as("review_count"),
  })
  .from(reviews)
  .where(eq(reviews.isApproved, true))
  .groupBy(reviews.productId)
  .as("ratings");

const sold = db
  .select({ productId: orderItems.productId, sold: sql<number>`sum(${orderItems.quantity})`.as("sold") })
  .from(orderItems)
  .groupBy(orderItems.productId)
  .as("sold");

const cardColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  comparePrice: products.comparePrice,
  stock: products.stock,
  image: products.image,
  categoryName: categories.name,
  rating: ratings.rating,
};

function cardQuery() {
  return db
    .select(cardColumns)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(ratings, eq(ratings.productId, products.id))
    .$dynamic();
}

export async function getNavCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoriesWithCounts() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image,
      description: categories.description,
      productCount: sql<number>`(select count(*) from ${products} where ${qualified(products.categoryId)} = ${qualified(categories.id)} and ${qualified(products.isActive)} = 1)`,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getActiveBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return db
    .select({ id: brands.id, name: brands.name, slug: brands.slug })
    .from(brands)
    .where(eq(brands.isActive, true))
    .orderBy(asc(brands.name));
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return cardQuery()
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit);
}

export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return cardQuery().where(eq(products.isActive, true)).orderBy(desc(products.createdAt), desc(products.id)).limit(limit);
}

export async function getStoreStats() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const [row] = await db
    .select({
      products: sql<number>`(select count(*) from ${products} where ${qualified(products.isActive)} = 1)`,
      brands: sql<number>`(select count(*) from ${brands} where ${qualified(brands.isActive)} = 1)`,
    })
    .from(sql`(select 1)`);
  return row;
}

export type ShopFilters = {
  q?: string;
  category?: string;
  brands?: string[];
  min?: number;
  max?: number;
  inStock?: boolean;
  sale?: boolean;
  sort?: string;
  page?: number;
};

export const PAGE_SIZE = 12;

export async function searchProducts(filters: ShopFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const where: (SQL | undefined)[] = [eq(products.isActive, true)];

  if (filters.category) where.push(eq(categories.slug, filters.category));
  if (filters.brands?.length) {
    where.push(inArray(products.brandId, db.select({ id: brands.id }).from(brands).where(inArray(brands.slug, filters.brands))));
  }
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push(or(like(products.name, term), like(products.shortDescription, term), eq(products.sku, filters.q)));
  }
  if (filters.min !== undefined) where.push(gte(products.price, filters.min));
  if (filters.max !== undefined) where.push(lte(products.price, filters.max));
  if (filters.inStock) where.push(gt(products.stock, 0));
  if (filters.sale) where.push(sql`${products.comparePrice} > ${products.price}`);

  const condition = and(...where);

  const order = {
    price_asc: [asc(products.price)],
    price_desc: [desc(products.price)],
    name: [asc(products.name)],
    popular: [desc(sql`coalesce(${sold.sold}, 0)`), desc(products.id)],
    rating: [desc(sql`coalesce(${ratings.rating}, 0)`), desc(products.id)],
  }[filters.sort ?? ""] ?? [desc(products.createdAt), desc(products.id)];

  const page = Math.max(1, filters.page ?? 1);

  const [items, [{ total }]] = await Promise.all([
    cardQuery()
      .leftJoin(sold, eq(sold.productId, products.id))
      .where(condition)
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)` })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(condition),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  return (await db.query.categories.findFirst({ where: and(eq(categories.slug, slug), eq(categories.isActive, true)) })) ?? null;
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: { category: true, brand: true },
  });
  if (!product) return null;

  const productReviews = await db
    .select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, userName: users.name })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt));

  const rating = productReviews.length ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length : 0;

  return { ...product, reviews: productReviews, rating };
}

export async function getRelatedProducts(productId: number, categoryId: number | null): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  if (!categoryId) return [];
  return cardQuery()
    .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(sql`coalesce(${ratings.rating}, 0)`), desc(products.id))
    .limit(4);
}
