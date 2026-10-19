"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

export function SearchForm({ className }: { className?: string }) {
  const q = useSearchParams().get("q") ?? "";

  return (
    <Form action="/shop" className={className}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        name="q"
        key={q}
        defaultValue={q}
        placeholder="Search products…"
        aria-label="Search products"
        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none"
      />
    </Form>
  );
}
