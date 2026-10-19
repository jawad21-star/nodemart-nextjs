import clsx from "clsx";
import { ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions, crumbs }: { title: string; description?: ReactNode; actions?: ReactNode; crumbs?: { href: string; label: string }[] }) {
  return (
    <div className="mb-6">
      {crumbs && (
        <nav className="mb-2 flex items-center gap-1 text-sm text-slate-500">
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-slate-900">
                {c.label}
              </Link>
              <ChevronRight className="size-3.5" />
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={clsx("card overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** GET search/filter bar for list pages. Extra filters are passed as children. */
export function Toolbar({ action, q, placeholder = "Search…", children }: { action: string; q?: string; placeholder?: string; children?: ReactNode }) {
  return (
    <Form action={action} className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label="Search" className="input !rounded-lg !py-2 !pl-9" />
      </div>
      {children}
      <button className="btn-outline !rounded-lg !px-4 !py-2">Filter</button>
    </Form>
  );
}

export function FilterSelect({ name, value, options, label }: { name: string; value?: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <select name={name} defaultValue={value ?? ""} aria-label={label} className="input !w-auto !rounded-lg !py-2">
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:pl-5 [&_td:last-child]:pr-5 [&_tr:hover]:bg-slate-50/70">{children}</tbody>
      </table>
      {empty && <p className="px-5 py-14 text-center text-sm text-slate-500">Nothing found.</p>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "slate", children }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "green" | "red" | "amber" | "slate" | "brand"; children?: ReactNode }) {
  const tones = { green: "text-emerald-600", red: "text-rose-600", amber: "text-amber-600", slate: "text-slate-500", brand: "text-brand-600" };
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className={clsx("mt-1 text-xs font-medium", tones[tone])}>{hint}</p>}
      {children}
    </div>
  );
}
