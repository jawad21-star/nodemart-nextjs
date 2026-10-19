import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent, money } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImage } from "./product-image";
import { Stars } from "./stars";

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.price, product.comparePrice);
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-slate-50">
        <ProductImage src={product.image} alt={product.name} className="size-full p-6 transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span>}
          {product.stock < 1 && <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.categoryName && <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{product.categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">
          <Link href={href} className="hover:text-brand-600">
            {product.name}
          </Link>
        </h3>

        {product.rating ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Stars rating={product.rating} size="size-3.5" />
            <span className="text-xs text-slate-400">{product.rating.toFixed(1)}</span>
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-slate-900">{money(product.price)}</p>
            {discount && <p className="text-xs text-slate-400 line-through">{money(product.comparePrice)}</p>}
          </div>
          {product.stock > 0 && <AddToCartButton productId={product.id} label={`Add ${product.name} to cart`} />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, columns = "lg:grid-cols-4" }: { products: ProductCardData[]; columns?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 sm:gap-6 ${columns}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
