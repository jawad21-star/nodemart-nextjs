import { and, asc, desc, eq, like, lt, or, type SQL } from "drizzle-orm";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { deleteProduct, setProductFlag } from "@/actions/admin";
import { ActionButton, ActionSwitch } from "@/components/admin/controls";
import { FilterSelect, PageHeader, Panel, Table, Toolbar } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/status-badge";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 15;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: (SQL | undefined)[] = [];
  if (q) where.push(or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`)));
  if (category) where.push(eq(products.categoryId, Number(category)));
  if (status === "active") where.push(eq(products.isActive, true));
  if (status === "hidden") where.push(eq(products.isActive, false));
  if (status === "featured") where.push(eq(products.isFeatured, true));
  if (status === "low") where.push(lt(products.stock, 5));
  const condition = and(...where);

  const [rows, total, allCategories] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        image: products.image,
        price: products.price,
        comparePrice: products.comparePrice,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        category: categories.name,
        brand: brands.name,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(condition)
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.$count(products, condition),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} products`}
        actions={
          <Link href="/admin/products/new" className="btn-brand !rounded-lg">
            <Plus className="size-4" /> New product
          </Link>
        }
      />
      <Panel>
        <Toolbar action="/admin/products" q={q} placeholder="Search by name or SKU…">
          <FilterSelect name="category" value={category} label="All categories" options={allCategories.map((c) => ({ value: String(c.id), label: c.name }))} />
          <FilterSelect
            name="status"
            value={status}
            label="Any status"
            options={[
              { value: "active", label: "Active" },
              { value: "hidden", label: "Hidden" },
              { value: "featured", label: "Featured" },
              { value: "low", label: "Low stock (< 5)" },
            ]}
          />
        </Toolbar>
        <Table head={["Product", "Category", "Price", "Stock", "Featured", "Active", ""]} empty={rows.length === 0}>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="flex min-w-60 items-center gap-3">
                  <div className="size-12 shrink-0 rounded-lg border border-slate-200 bg-slate-50">
                    <ProductImage src={p.image} alt={p.name} className="size-full p-1" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium text-slate-900 hover:text-brand-600">
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">{[p.sku, p.brand].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              </td>
              <td>{p.category ? <Badge>{p.category}</Badge> : <span className="text-slate-400">—</span>}</td>
              <td className="whitespace-nowrap">
                <span className="font-medium">{money(p.price)}</span>
                {p.comparePrice && <span className="ml-1.5 text-xs text-slate-400 line-through">{money(p.comparePrice)}</span>}
              </td>
              <td>
                <Badge color={p.stock === 0 ? "red" : p.stock < 5 ? "amber" : "green"}>{p.stock}</Badge>
              </td>
              <td>
                <ActionSwitch checked={p.isFeatured} action={setProductFlag.bind(null, p.id, "isFeatured")} label={`Feature ${p.name}`} />
              </td>
              <td>
                <ActionSwitch checked={p.isActive} action={setProductFlag.bind(null, p.id, "isActive")} label={`Show ${p.name} in store`} />
              </td>
              <td>
                <div className="flex justify-end gap-1">
                  <Link href={`/product/${p.slug}`} target="_blank" className="btn-ghost !p-2" title="View in store" aria-label="View in store">
                    <Eye className="size-4" />
                  </Link>
                  <Link href={`/admin/products/${p.id}`} className="btn-ghost !p-2" title="Edit" aria-label="Edit">
                    <Pencil className="size-4" />
                  </Link>
                  <ActionButton
                    action={deleteProduct.bind(null, p.id)}
                    confirm={`Delete "${p.name}"? This cannot be undone.`}
                    success="Product deleted."
                    className="btn-ghost !p-2 text-rose-600 hover:!bg-rose-50"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        <div className="pb-6">
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} params={params} basePath="/admin/products" />
        </div>
      </Panel>
    </>
  );
}
