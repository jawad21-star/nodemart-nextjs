import { Phone, ShoppingBag, Truck, User } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { cartCount } from "@/lib/cart";
import { getNavCategories } from "@/lib/catalog";
import { shop } from "@/lib/config";
import { money } from "@/lib/format";
import { MobileMenu, MobileSearch } from "./mobile-menu";
import { SearchForm } from "./search-form";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/30">
        <ShoppingBag className="size-5" />
      </span>
      {shop.name}
    </Link>
  );
}

async function CartBadge() {
  const count = await cartCount();
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] leading-5 font-bold text-white ring-2 ring-white">
      {count}
    </span>
  );
}

export async function Header() {
  const categories = await getNavCategories();

  return (
    <>
      <div className="bg-slate-900 text-white">
        <div className="container-shop flex h-9 items-center justify-center gap-2 text-xs font-medium sm:justify-between">
          <p className="flex items-center gap-2">
            <Truck className="size-4" /> Free delivery on orders over {money(shop.freeShippingOver)}
          </p>
          <p className="hidden items-center gap-4 text-slate-300 sm:flex">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> {shop.phone}
            </span>
            <span>
              Use code <strong className="text-white">WELCOME10</strong> for 10% off
            </span>
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
        <div className="container-shop flex h-16 items-center gap-4 lg:h-[72px]">
          <MobileMenu categories={categories} />
          <Logo />

          <nav className="ml-4 hidden items-center gap-0.5 whitespace-nowrap lg:flex">
            <Link href="/shop" className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Shop all
            </Link>
            {categories.slice(0, 4).map((c, i) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 ${i >= 2 ? "hidden xl:inline-flex" : ""}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <Suspense fallback={<div className="ml-auto hidden w-full max-w-xs md:block" />}>
            <SearchForm className="relative ml-auto hidden w-full max-w-xs md:block" />
          </Suspense>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <MobileSearch />
            <Link href="/account" className="btn-ghost !p-2.5" aria-label="Account">
              <User className="size-5" />
            </Link>
            <Link href="/cart" className="btn-ghost relative !p-2.5" aria-label="Cart">
              <ShoppingBag className="size-5" />
              <Suspense fallback={null}>
                <CartBadge />
              </Suspense>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
