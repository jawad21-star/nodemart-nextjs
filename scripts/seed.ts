/**
 * Fills the database with demo data: real products from dummyjson.com,
 * customers, 60 days of orders, reviews and coupons.
 *
 *   npm run db:seed
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  brands,
  categories,
  coupons,
  orderItems,
  orders,
  products,
  reviews,
  users,
  wishlists,
  type OrderStatus,
} from "../src/db/schema";

const CATEGORY_MAP: Record<string, { sources: string[]; description: string }> = {
  Electronics: { sources: ["smartphones", "laptops", "tablets", "mobile-accessories"], description: "Shop the latest smartphones, laptops and accessories." },
  "Men's Fashion": { sources: ["mens-shirts", "mens-shoes", "mens-watches"], description: "Shirts, shoes and watches for every occasion." },
  "Women's Fashion": { sources: ["womens-dresses", "womens-shoes", "womens-bags", "womens-jewellery", "womens-watches", "tops"], description: "Dresses, bags, jewellery and more." },
  "Beauty & Fragrance": { sources: ["beauty", "fragrances", "skin-care"], description: "Makeup, skincare and signature scents." },
  "Home & Living": { sources: ["furniture", "home-decoration", "kitchen-accessories"], description: "Furniture, decor and kitchen essentials." },
  "Sports & Outdoors": { sources: ["sports-accessories", "sunglasses"], description: "Gear up for the game and the outdoors." },
};

const FIRST = ["Ali", "Ayesha", "Bilal", "Fatima", "Hamza", "Hira", "Usman", "Zainab", "Saad", "Mahnoor", "Omar", "Sana", "Ahmed", "Iqra", "Hassan", "Maryam", "Danish", "Noor", "Faizan", "Alina"];
const LAST = ["Khan", "Ahmed", "Malik", "Hussain", "Raza", "Sheikh", "Butt", "Chaudhry", "Qureshi", "Siddiqui"];
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"];

type RemoteProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  brand?: string;
  sku?: string;
  thumbnail: string;
  images?: string[];
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: readonly T[]): T => items[rand(0, items.length - 1)];
const sample = <T,>(items: readonly T[], n: number): T[] => [...items].sort(() => Math.random() - 0.5).slice(0, n);
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const escapeHtml = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function weighted<T extends string | number>(weights: [T, number][]): T {
  let roll = rand(1, weights.reduce((s, [, w]) => s + w, 0));
  for (const [value, weight] of weights) if ((roll -= weight) <= 0) return value;
  return weights[0][0];
}

async function fetchRemoteProducts(): Promise<RemoteProduct[]> {
  try {
    const res = await fetch("https://dummyjson.com/products?limit=0", { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { products: RemoteProduct[] }).products;
  } catch (error) {
    console.warn(`Could not reach dummyjson.com (${(error as Error).message}) — using placeholder products.`);
    return [];
  }
}

async function main() {
  console.log("Clearing tables…");
  for (const table of [wishlists, reviews, orderItems, orders, coupons, products, brands, categories, users]) {
    await db.delete(table);
  }

  console.log("Creating users…");
  const password = await bcrypt.hash("password", 10);

  await db.insert(users).values({ name: "Store Admin", email: "admin@shop.test", passwordHash: password, isAdmin: true });

  const customers = await db
    .insert(users)
    .values([
      { name: "Demo Customer", email: "customer@shop.test", passwordHash: password, phone: "+92 300 1234567", city: "Lahore", address: "12 Main Boulevard, Gulberg" },
      ...Array.from({ length: 25 }, (_, i) => {
        const name = `${pick(FIRST)} ${pick(LAST)}`;
        return {
          name,
          email: `${slugify(name)}.${i + 1}@example.com`,
          passwordHash: password,
          phone: `+92 3${rand(0, 4)}${rand(0, 9)} ${rand(1000000, 9999999)}`,
          city: pick(CITIES),
          address: `House ${rand(1, 250)}, Street ${rand(1, 40)}`,
          createdAt: new Date(Date.now() - rand(1, 90) * 86_400_000),
        };
      }),
    ])
    .returning();

  console.log("Fetching catalog from dummyjson.com…");
  const remote = await fetchRemoteProducts();

  let sortOrder = 0;
  for (const [name, { sources, description }] of Object.entries(CATEGORY_MAP)) {
    const [category] = await db.insert(categories).values({ name, slug: slugify(name), description, sortOrder: sortOrder++ }).returning();
    const items = remote.filter((p) => sources.includes(p.category));

    for (const [i, item] of items.entries()) {
      let brandId: number | null = null;
      if (item.brand) {
        const [brand] = await db
          .insert(brands)
          .values({ name: item.brand, slug: slugify(item.brand) })
          .onConflictDoUpdate({ target: brands.slug, set: { name: item.brand } })
          .returning();
        brandId = brand.id;
      }

      const price = Math.max(199, Math.round((item.price * 280) / 10) * 10 - 1);
      const discount = item.discountPercentage ?? 0;

      await db.insert(products).values({
        categoryId: category.id,
        brandId,
        name: item.title,
        slug: `${slugify(item.title)}-${item.id}`,
        sku: item.sku ?? `SKU-${item.id}`,
        shortDescription: item.description.length > 160 ? `${item.description.slice(0, 157)}…` : item.description,
        description:
          `<p>${escapeHtml(item.description)}</p><ul>` +
          `<li><strong>Brand:</strong> ${escapeHtml(item.brand ?? "Generic")}</li>` +
          `<li><strong>Warranty:</strong> ${escapeHtml(item.warrantyInformation ?? "No warranty")}</li>` +
          `<li><strong>Shipping:</strong> ${escapeHtml(item.shippingInformation ?? "Ships in 3-5 days")}</li>` +
          `<li><strong>Returns:</strong> ${escapeHtml(item.returnPolicy ?? "7 days return policy")}</li></ul>`,
        price,
        comparePrice: discount >= 8 ? Math.round(price / (1 - discount / 100) / 10) * 10 - 1 : null,
        stock: i % 11 === 0 ? rand(0, 4) : rand(8, 120),
        image: item.images?.[0] ?? item.thumbnail,
        gallery: (item.images ?? []).slice(1),
        isFeatured: i < 2 || (item.rating ?? 0) >= 4.7,
        createdAt: new Date(Date.now() - (items.length - i) * 3_600_000),
      });
    }

    if (items.length === 0) {
      for (let n = 1; n <= 6; n++) {
        await db.insert(products).values({
          categoryId: category.id,
          name: `${name} Item ${n}`,
          slug: `${slugify(name)}-item-${n}`,
          shortDescription: "A great product for everyday use.",
          description: "<p>A great product for everyday use.</p>",
          price: rand(10, 300) * 50 - 1,
          stock: rand(5, 60),
          isFeatured: n <= 2,
        });
      }
    }

    const first = await db.query.products.findFirst({ where: eq(products.categoryId, category.id) });
    if (first?.image) await db.update(categories).set({ image: first.image }).where(eq(categories.id, category.id));
  }

  console.log("Creating coupons…");
  await db.insert(coupons).values([
    { code: "WELCOME10", type: "percent", value: 10 },
    { code: "FLAT500", type: "fixed", value: 500, minAmount: 3000 },
    { code: "MEGA25", type: "percent", value: 25, minAmount: 10000, maxUses: 50, expiresAt: new Date(Date.now() + 30 * 86_400_000) },
  ]);

  console.log("Creating orders…");
  const inStock = (await db.query.products.findMany()).filter((p) => p.stock > 0);
  for (let n = 0; n < 90; n++) {
    const customer = pick(customers);
    const date = new Date(Date.now() - rand(20, 59 * 24 * 60) * 60_000);
    const status = weighted<OrderStatus>([["delivered", 45], ["shipped", 15], ["processing", 15], ["pending", 15], ["cancelled", 10]]);
    const method = Math.random() < 0.7 ? "cod" : "bank";
    const lines = sample(inStock, rand(1, 4)).map((p) => {
      const quantity = rand(1, 3);
      return { productId: p.id, productName: p.name, price: p.price, quantity, total: p.price * quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const shipping = subtotal >= 5000 ? 0 : 250;
    const ymd = date.toISOString().slice(2, 10).replaceAll("-", "");

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: `ORD-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        userId: customer.id,
        status,
        paymentMethod: method,
        paymentStatus: status === "delivered" || (method === "bank" && status !== "cancelled") ? "paid" : "unpaid",
        subtotal,
        shipping,
        total: subtotal + shipping,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? "+92 300 0000000",
        address: customer.address ?? "Main Road",
        city: customer.city ?? "Lahore",
        createdAt: date,
        updatedAt: date,
      })
      .returning();
    await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
  }

  console.log("Creating reviews…");
  const comments: Record<number, string[]> = {
    5: ["Excellent quality, exactly as shown. Highly recommended!", "Fast delivery and great packaging. Love it!", "Best purchase this year. Worth every rupee."],
    4: ["Very good product, delivery took a little longer than expected.", "Good value for money. Would buy again."],
    3: ["Decent product, but could be better for the price.", "Okay overall. Packaging was average."],
  };
  for (const product of sample(await db.query.products.findMany(), 40)) {
    for (const customer of sample(customers, rand(1, 4))) {
      const rating = weighted<number>([[5, 55], [4, 30], [3, 15]]);
      await db.insert(reviews).values({
        productId: product.id,
        userId: customer.id,
        rating,
        comment: pick(comments[rating]),
        isApproved: Math.random() > 0.2,
        createdAt: new Date(Date.now() - rand(1, 40) * 86_400_000),
      });
    }
  }

  const count = async (table: Parameters<typeof db.$count>[0]) => db.$count(table);
  console.log(
    `Done: ${await count(products)} products, ${await count(categories)} categories, ${await count(brands)} brands, ` +
      `${await count(users)} users, ${await count(orders)} orders, ${await count(reviews)} reviews.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
