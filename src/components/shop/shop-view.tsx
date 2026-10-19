import { ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { getActiveBrands, getCategoriesWithCounts, searchProducts, type ShopFilters } from "@/lib/catalog";
import { shop } from "@/lib/config";
import { FiltersDrawer, SortSelect } from "./shop-controls";
import { Pagination } from "@/components/pagination";

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export function parseFilters(params: Params, category?: string): ShopFilters {
  const brands = params.brand;
  return {
    q: first(params.q)?.trim() || undefined,
    category,
    brands: (Array.isArray(brands) ? brands : brands ? [brands] : []).filter(Boolean),
    min: num(first(params.min)),
    max: num(first(params.max)),
    inStock: first(params.in_stock) === "1",
    sale: first(params.sale) === "1",
    sort: first(params.sort),
    page: num(first(params.page)),
  };
}

export function ShopHeader({ title, description, crumb }: { title: string; description?: string | null; crumb?: string }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50">
      <div className="container-shop py-10">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/shop" className="hover:text-slate-900">
            Shop
          </Link>
          {crumb && (
            <>
              <ChevronRight className="size-3.5" />
              <span className="text-slate-900">{crumb}</span>
            </>
          )}
        </nav>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

export async function ShopResults({ params, categorySlug }: { params: Params; categorySlug?: string }) {
  const filters = parseFilters(params, categorySlug);
  const action = categorySlug ? `/category/${categorySlug}` : "/shop";
  const [result, categories, brands] = await Promise.all([searchProducts(filters), getCategoriesWithCounts(), getActiveBrands()]);
  const selected = new Set(filters.brands);

  const filterForm = (
    <Form action={action} className="space-y-8">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      {!categorySlug && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
          <ul className="mt-3 space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {c.name} <span className="text-xs text-slate-400">{c.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Price ({shop.currency})</h3>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" name="min" min={0} defaultValue={filters.min} placeholder="Min" aria-label="Minimum price" className="input !px-3 !py-2" />
          <span className="text-slate-400">–</span>
          <input type="number" name="max" min={0} defaultValue={filters.max} placeholder="Max" aria-label="Maximum price" className="input !px-3 !py-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Availability</h3>
        <label className="flex items-center gap-2.5 text-sm text-slate-600">
          <input type="checkbox" name="in_stock" value="1" defaultChecked={filters.inStock} className="size-4 accent-brand-600" /> In stock only
        </label>
        <label className="flex items-center gap-2.5 text-sm text-slate-600">
          <input type="checkbox" name="sale" value="1" defaultChecked={filters.sale} className="size-4 accent-brand-600" /> On sale
        </label>
      </div>

      {brands.length > 0 && (
        <details className="group" open={selected.size > 0 || undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
            Brands {selected.size > 0 && <span className="rounded-full bg-brand-100 px-2 text-xs text-brand-700">{selected.size}</span>}
            <ChevronRight className="size-4 text-slate-400 transition group-open:rotate-90" />
          </summary>
          <div className="mt-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label key={b.id} className="flex items-center gap-2.5 text-sm text-slate-600">
                <input type="checkbox" name="brand" value={b.slug} defaultChecked={selected.has(b.slug)} className="size-4 accent-brand-600" /> {b.name}
              </label>
            ))}
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1">Apply filters</button>
        <Link href={action} className="btn-outline">
          Reset
        </Link>
      </div>
    </Form>
  );

  const from = result.total === 0 ? 0 : (result.page - 1) * 12 + 1;
  const to = Math.min(result.page * 12, result.total);

  return (
    <div className="container-shop py-10">
      <div className="flex gap-10">
        <FiltersDrawer>{filterForm}</FiltersDrawer>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {from}–{to}
              </span>{" "}
              of {result.total} products
            </p>
            <SortSelect value={filters.sort ?? "newest"} />
          </div>

          {result.items.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-20 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="size-7" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">No products found</h2>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search terms.</p>
              <Link href="/shop" className="btn-primary mt-6">
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <ProductGrid products={result.items} columns="xl:grid-cols-3" />
              <Pagination page={result.page} pages={result.pages} params={params} basePath={action} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShopResultsSkeleton() {
  return (
    <div className="container-shop py-10">
      <div className="flex gap-10">
        <div className="hidden w-64 shrink-0 space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-6 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
