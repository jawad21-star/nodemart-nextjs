"use client";

import clsx from "clsx";
import { Heart, LayoutDashboard, LogOut, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

export function AccountNav({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const item = (active: boolean) =>
    clsx("flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium transition", active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50");

  return (
    <aside className="lg:w-60 lg:shrink-0">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </div>
        <nav className="mt-5 space-y-1 text-sm">
          <Link href="/account" className={item(pathname === "/account" || pathname.startsWith("/account/orders"))}>
            <Package className="size-4" /> Orders & profile
          </Link>
          <Link href="/account/wishlist" className={item(pathname === "/account/wishlist")}>
            <Heart className="size-4" /> Wishlist
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-brand-600 hover:bg-brand-50">
              <LayoutDashboard className="size-4" /> Admin panel
            </Link>
          )}
          <form action={logout}>
            <button className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </nav>
      </div>
    </aside>
  );
}
