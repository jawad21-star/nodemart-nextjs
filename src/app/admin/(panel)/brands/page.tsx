import { asc, like, sql } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { brands, products } from "@/db/schema";
import { deleteBrand } from "@/actions/admin";
import { ActionButton } from "@/components/admin/controls";
import { PageHeader, Panel, Table, Toolbar } from "@/components/admin/ui";
import { Badge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage({ searchParams }: PageProps<"/admin/brands">) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";

  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      isActive: brands.isActive,
      productCount: sql<number>`(select count(*) from ${products} where ${qualified(products.brandId)} = ${qualified(brands.id)})`,
    })
    .from(brands)
    .where(search ? like(brands.name, `%${search}%`) : undefined)
    .orderBy(asc(brands.name));

  return (
    <>
      <PageHeader
        title="Brands"
        description={`${rows.length} brands`}
        actions={
          <Link href="/admin/brands/new" className="btn-brand !rounded-lg">
            <Plus className="size-4" /> New brand
          </Link>
        }
      />
      <Panel>
        <Toolbar action="/admin/brands" q={search} placeholder="Search brands…" />
        <Table head={["Brand", "Slug", "Products", "Status", ""]} empty={rows.length === 0}>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <Link href={`/admin/brands/${b.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                  {b.name}
                </Link>
              </td>
              <td className="text-slate-500">{b.slug}</td>
              <td>
                <Badge color="brand">{b.productCount}</Badge>
              </td>
              <td>{b.isActive ? <Badge color="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/brands/${b.id}`} className="btn-ghost !p-2" aria-label="Edit" title="Edit">
                    <Pencil className="size-4" />
                  </Link>
                  <ActionButton
                    action={deleteBrand.bind(null, b.id)}
                    confirm={`Delete "${b.name}"?`}
                    success="Brand deleted."
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
