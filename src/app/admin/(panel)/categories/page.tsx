import { asc, sql } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { categories, products } from "@/db/schema";
import { deleteCategory } from "@/actions/admin";
import { ActionButton } from "@/components/admin/controls";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      image: categories.image,
      isActive: categories.isActive,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`(select count(*) from ${products} where ${qualified(products.categoryId)} = ${qualified(categories.id)})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <>
      <PageHeader
        title="Categories"
        description={`${rows.length} categories`}
        actions={
          <Link href="/admin/categories/new" className="btn-brand !rounded-lg">
            <Plus className="size-4" /> New category
          </Link>
        }
      />
      <Panel>
        <Table head={["Category", "Slug", "Products", "Order", "Status", ""]} empty={rows.length === 0}>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50">
                    <ProductImage src={c.image} alt={c.name} className="size-full p-1" />
                  </div>
                  <Link href={`/admin/categories/${c.id}`} className="font-medium whitespace-nowrap text-slate-900 hover:text-brand-600">
                    {c.name}
                  </Link>
                </div>
              </td>
              <td className="text-slate-500">{c.slug}</td>
              <td>
                <Badge color="brand">{c.productCount}</Badge>
              </td>
              <td className="text-slate-500">{c.sortOrder}</td>
              <td>{c.isActive ? <Badge color="green">Visible</Badge> : <Badge>Hidden</Badge>}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/categories/${c.id}`} className="btn-ghost !p-2" aria-label="Edit" title="Edit">
                    <Pencil className="size-4" />
                  </Link>
                  <ActionButton
                    action={deleteCategory.bind(null, c.id)}
                    confirm={`Delete "${c.name}"? Its products will be left without a category.`}
                    success="Category deleted."
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
      </Panel>
    </>
  );
}
