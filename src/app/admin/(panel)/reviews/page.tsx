import { and, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { Check, Trash2, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { deleteReview, setReviewApproved } from "@/actions/admin";
import { ActionButton } from "@/components/admin/controls";
import { FilterSelect, PageHeader, Panel, Table, Toolbar } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

const PER_PAGE = 15;

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: (SQL | undefined)[] = [];
  if (q) where.push(or(like(products.name, `%${q}%`), like(users.name, `%${q}%`), like(reviews.comment, `%${q}%`)));
  if (status === "pending") where.push(eq(reviews.isApproved, false));
  if (status === "approved") where.push(eq(reviews.isApproved, true));
  const condition = and(...where);

  const base = db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      isApproved: reviews.isApproved,
      createdAt: reviews.createdAt,
      productId: products.id,
      productName: products.name,
      userId: users.id,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(condition);

  const [rows, [{ total }]] = await Promise.all([
    base.orderBy(reviews.isApproved, desc(reviews.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db
      .select({ total: sql<number>`count(*)` })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(condition),
  ]);

  return (
    <>
      <PageHeader title="Reviews" description="Approve reviews before they appear on product pages." />
      <Panel>
        <Toolbar action="/admin/reviews" q={q} placeholder="Product, customer or comment…">
          <FilterSelect
            name="status"
            value={status}
            label="All reviews"
            options={[
              { value: "pending", label: "Pending approval" },
              { value: "approved", label: "Approved" },
            ]}
          />
        </Toolbar>
        <Table head={["Product", "Customer", "Rating", "Comment", "Status", ""]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/admin/products/${r.productId}`} className="line-clamp-2 min-w-40 font-medium text-slate-900 hover:text-brand-600">
                  {r.productName}
                </Link>
              </td>
              <td>
                <Link href={`/admin/customers/${r.userId}`} className="whitespace-nowrap text-slate-700 hover:text-brand-600">
                  {r.userName}
                </Link>
                <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
              </td>
              <td>
                <Stars rating={r.rating} size="size-3.5" />
              </td>
              <td className="max-w-xs text-slate-600">{r.comment ?? <span className="text-slate-400">—</span>}</td>
              <td>{r.isApproved ? <Badge color="green">Approved</Badge> : <Badge color="amber">Pending</Badge>}</td>
              <td>
                <div className="flex justify-end gap-1">
                  {r.isApproved ? (
                    <ActionButton action={setReviewApproved.bind(null, r.id, false)} success="Review hidden." className="btn-ghost !p-2" title="Unapprove">
                      <X className="size-4" />
                    </ActionButton>
                  ) : (
                    <ActionButton action={setReviewApproved.bind(null, r.id, true)} success="Review approved." className="btn-ghost !p-2 text-emerald-600 hover:!bg-emerald-50" title="Approve">
                      <Check className="size-4" />
                    </ActionButton>
                  )}
                  <ActionButton
                    action={deleteReview.bind(null, r.id)}
                    confirm="Delete this review?"
                    success="Review deleted."
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
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} params={params} basePath="/admin/reviews" />
        </div>
      </Panel>
    </>
  );
}
