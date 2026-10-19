import { and, eq } from "drizzle-orm";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db";
import { reviews, wishlists } from "@/db/schema";
import { ProductGrid } from "@/components/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductTabs } from "@/components/shop/product-tabs";
import { ReviewForm } from "@/components/shop/review-form";
import { Stars } from "@/components/stars";
import { WishlistButton } from "@/components/wishlist-button";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { discountPercent, formatDate, money } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.shortDescription ?? undefined } : { title: "Product not found" };
}

async function Wishlist({ productId }: { productId: number }) {
  const user = await getCurrentUser();
  const saved = user
    ? !!(await db.query.wishlists.findFirst({ where: and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)) }))
    : false;
  return <WishlistButton productId={productId} initial={saved} />;
}

async function ReviewSlot({ productId, slug }: { productId: number; slug: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="mt-8 text-sm text-slate-500">
        <Link href={`/login?next=/product/${slug}`} className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }
  const existing = await db.query.reviews.findFirst({ where: and(eq(reviews.productId, productId), eq(reviews.userId, user.id)) });
  if (existing) return <p className="mt-8 text-sm text-slate-500">Thanks — you&apos;ve already reviewed this product.</p>;
  return <ReviewForm productId={productId} />;
}

async function ProductView({ params }: { params: PageProps<"/product/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId);
  const discount = discountPercent(product.price, product.comparePrice);
  const images = [product.image, ...product.gallery].filter((v, i, all): v is string => !!v && all.indexOf(v) === i);

  return (
    <div className="container-shop py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-slate-900">
              {product.category.name}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="truncate text-slate-900">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} alt={product.name} badge={discount} />

        <div>
          {product.brand && (
            <Link href={`/shop?brand=${product.brand.slug}`} className="text-sm font-semibold tracking-wide text-brand-600 uppercase hover:text-brand-700">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {product.reviews.length ? (
              <>
                <Stars rating={product.rating} />
                <a href="#reviews" className="text-slate-500 hover:text-slate-900">
                  {product.rating.toFixed(1)} · {product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"}
                </a>
              </>
            ) : (
              <span className="text-slate-400">No reviews yet</span>
            )}
            {product.sku && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">SKU: {product.sku}</span>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <p className="text-3xl font-extrabold text-slate-900">{money(product.price)}</p>
            {discount && (
              <>
                <p className="text-lg text-slate-400 line-through">{money(product.comparePrice)}</p>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-600">Save {money(product.comparePrice! - product.price)}</span>
              </>
            )}
          </div>

          {product.shortDescription && <p className="mt-5 leading-relaxed text-slate-600">{product.shortDescription}</p>}

          <div className="mt-6">
            {product.stock > 5 ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                <span className="size-2 rounded-full bg-emerald-500" /> In stock
              </p>
            ) : product.stock > 0 ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">
                <span className="size-2 animate-pulse rounded-full bg-amber-500" /> Only {product.stock} left — order soon
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-600">
                <span className="size-2 rounded-full bg-rose-500" /> Out of stock
              </p>
            )}
          </div>

          {product.stock > 0 && (
            <ProductPurchase
              productId={product.id}
              stock={product.stock}
              wishlist={
                <Suspense fallback={<div className="size-12 rounded-full border border-slate-200" />}>
                  <Wishlist productId={product.id} />
                </Suspense>
              }
            />
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-3">
            <p className="flex items-center gap-2 text-slate-600">
              <Truck className="size-5 text-brand-600" /> 2-4 day delivery
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <RotateCcw className="size-5 text-brand-600" /> 7-day returns
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="size-5 text-brand-600" /> 100% genuine
            </p>
          </div>

          <ProductTabs description={product.description} />
        </div>
      </div>

      <section id="reviews" className="mt-20 scroll-mt-28 border-t border-slate-200 pt-12">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Customer reviews</h2>
            <div className="mt-4 flex items-center gap-3">
              <p className="text-5xl font-extrabold text-slate-900">{product.rating.toFixed(1)}</p>
              <div>
                <Stars rating={product.rating} size="size-5" />
                <p className="mt-1 text-sm text-slate-500">Based on {product.reviews.length} reviews</p>
              </div>
            </div>
            <Suspense fallback={null}>
              <ReviewSlot productId={product.id} slug={product.slug} />
            </Suspense>
          </div>

          <div className="space-y-4 lg:col-span-2">
            {product.reviews.length === 0 && (
              <div className="card px-6 py-12 text-center text-sm text-slate-500">No reviews yet. Be the first to review this product!</div>
            )}
            {product.reviews.map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">{review.userName.charAt(0).toUpperCase()}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.userName}</p>
                      <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-slate-900">You may also like</h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-shop grid gap-10 py-16 lg:grid-cols-2 lg:gap-16">
      <div className="aspect-square animate-pulse rounded-3xl bg-slate-100" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-24 animate-pulse rounded bg-slate-100" />
        <div className="h-12 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}
