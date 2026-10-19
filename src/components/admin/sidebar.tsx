"use client";

import clsx from "clsx";
import {
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  Tag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/actions/auth";
import { shop } from "@/lib/config";

type Badges = { pendingOrders: number; lowStock: number; pendingReviews: number };

type NavItem = { href: string; label: string; Icon: typeof Package; badge?: keyof Badges };

const GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", Icon: ShoppingBag, badge: "pendingOrders" },
      { href: "/admin/coupons", label: "Coupons", Icon: Ticket },
      { href: "/admin/reviews", label: "Reviews", Icon: MessageSquare, badge: "pendingReviews" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", Icon: Package, badge: "lowStock" },
      { href: "/admin/categories", label: "Categories", Icon: LayoutGrid },
      { href: "/admin/brands", label: "Brands", Icon: Tag },
    ],
  },
  { title: "Customers", items: [{ href: "/admin/customers", label: "Customers", Icon: Users }] },
];

function Nav({ badges, onNavigate }: { badges: Badges; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate?.()}>
      {GROUPS.map((group) => (
        <div key={group.title ?? "main"}>
          {group.title && <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">{group.title}</p>}
          <div className="space-y-0.5">
            {group.items.map(({ href, label, Icon, badge }) => {
              const count = badge ? badges[badge] : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", badge === "lowStock" ? "bg-rose-100 text-rose-700" : "bg-brand-100 text-brand-700")}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
          <ExternalLink className="size-[18px]" /> View store
        </Link>
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
        <ShoppingBag className="size-4" />
      </span>
      {shop.name} <span className="font-medium text-slate-400">Admin</span>
    </Link>
  );
}

function UserBox({ name, email }: { name: string; email: string }) {
  return (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
        </div>
        <form action={logout}>
          <button className="btn-ghost !p-2" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ badges, user }: { badges: Badges; user: { name: string; email: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button className="btn-ghost -ml-2 !p-2" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <Brand />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <Brand />
              <button className="btn-ghost !p-2" onClick={() => setOpen(false)} aria-label="Close navigation">
                <X className="size-5" />
              </button>
            </div>
            <Nav badges={badges} onNavigate={() => setOpen(false)} />
            <UserBox {...user} />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Brand />
        </div>
        <Nav badges={badges} />
        <UserBox {...user} />
      </aside>
    </>
  );
}
