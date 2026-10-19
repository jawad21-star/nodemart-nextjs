"use client";

import { ChevronRight, Menu, Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { shop } from "@/lib/config";

type NavCategory = { id: number; name: string; slug: string };

export function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost -ml-2 !p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] animate-slide-in flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <span className="text-lg font-extrabold">{shop.name}</span>
              <button className="btn-ghost -mr-2 !p-2" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-6" />
              </button>
            </div>
            {/* Close the drawer when any link inside it is followed. */}
            <nav className="flex-1 overflow-y-auto p-3" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
              <Link href="/shop" className="flex items-center justify-between rounded-xl px-3 py-3 font-semibold hover:bg-slate-50">
                Shop all <ChevronRight className="size-4 text-slate-400" />
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center justify-between rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  {c.name} <ChevronRight className="size-4 text-slate-400" />
                </Link>
              ))}
              <div className="my-3 border-t border-slate-100" />
              <Link href="/account" className="block rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">
                My account
              </Link>
              <Link href="/account/wishlist" className="block rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">
                Wishlist
              </Link>
              <Link href="/cart" className="block rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">
                Cart
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost !p-2.5 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Search">
        <Search className="size-5" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-t border-slate-100 bg-white md:hidden">
          <Form action="/shop" className="container-shop py-3" onSubmit={() => setOpen(false)}>
            <input type="search" name="q" autoFocus placeholder="Search products…" aria-label="Search products" className="input" />
          </Form>
        </div>
      )}
    </>
  );
}
