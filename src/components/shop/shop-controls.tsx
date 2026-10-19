"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

/** Sidebar on desktop, slide-over drawer on mobile. */
export function FiltersDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn-outline fixed right-4 bottom-4 z-30 !px-4 !py-2 shadow-lg lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" /> Filters
      </button>
      <aside className={`fixed inset-0 z-50 lg:static lg:z-auto lg:block lg:w-64 lg:shrink-0 ${open ? "block" : "hidden"}`}>
        <div className="absolute inset-0 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />
        {/* Close the drawer once filters are applied or a category link is followed. */}
        <div
          className="absolute inset-y-0 right-0 w-80 max-w-[85%] overflow-y-auto bg-white p-6 lg:static lg:w-auto lg:p-0"
          onSubmitCapture={() => setOpen(false)}
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-bold">Filters</h2>
            <button type="button" className="btn-ghost !p-2" onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </aside>
    </>
  );
}

const SORTS = [
  ["newest", "Newest"],
  ["popular", "Best selling"],
  ["rating", "Top rated"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["name", "Name A–Z"],
] as const;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      aria-label="Sort products"
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", e.target.value);
        params.delete("page");
        router.push(`${pathname}?${params}`);
      }}
      className="rounded-full border border-slate-300 bg-white py-2 pr-9 pl-4 text-sm font-medium focus:border-brand-500 focus:outline-none"
    >
      {SORTS.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
