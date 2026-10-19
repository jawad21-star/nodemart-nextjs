import { desc, eq } from "drizzle-orm";
import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { categories, products, wishlists } from "@/db/schema";
import { ProductGrid } from "@/components/product-card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Wishlist" };

// Per-user page: always rendered for the signed-in customer.
export const instant = false;

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const items = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      comparePrice: products.comparePrice,
      stock: products.stock,
      image: products.image,
      categoryName: categories.name,
    })
    .from(wishlists)
    .innerJoin(products, eq(products.id, wishlists.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(wishlists.userId, user.id))
    .orderBy(desc(wishlists.createdAt));

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-400">
          <Heart className="size-7" />
        </span>
        <p className="mt-5 font-semibold text-slate-900">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-slate-500">Tap the heart on any product page to save it here.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Discover products
        </Link>
      </div>
    );
  }

  return <ProductGrid products={items.map((p) => ({ ...p, rating: null }))} columns="xl:grid-cols-3" />;
}
