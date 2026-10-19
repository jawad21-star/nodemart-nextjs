import { desc } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { deleteCoupon, setCouponActive } from "@/actions/admin";
import { ActionButton, ActionSwitch } from "@/components/admin/controls";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/status-badge";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await connection();
  const now = new Date();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply in the cart."
        actions={
          <Link href="/admin/coupons/new" className="btn-brand !rounded-lg">
            <Plus className="size-4" /> New coupon
          </Link>
        }
      />
      <Panel>
        <Table head={["Code", "Discount", "Min. order", "Used", "Expires", "Active", ""]} empty={rows.length === 0}>
          {rows.map((c) => {
            const expired = c.expiresAt && c.expiresAt < now;
            return (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/coupons/${c.id}`} className="rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-sm font-bold text-brand-700 hover:bg-brand-100">
                    {c.code}
                  </Link>
                </td>
                <td className="font-medium whitespace-nowrap">{c.type === "percent" ? `${c.value}%` : money(c.value)}</td>
                <td className="whitespace-nowrap text-slate-500">{c.minAmount ? money(c.minAmount) : "—"}</td>
                <td className="whitespace-nowrap">
                  {c.usedCount} / {c.maxUses ?? "∞"}
                </td>
                <td className="whitespace-nowrap">{c.expiresAt ? expired ? <Badge color="red">Expired {formatDate(c.expiresAt)}</Badge> : formatDate(c.expiresAt) : <span className="text-slate-400">Never</span>}</td>
                <td>
                  <ActionSwitch checked={c.isActive} action={setCouponActive.bind(null, c.id)} label={`Activate ${c.code}`} />
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/coupons/${c.id}`} className="btn-ghost !p-2" aria-label="Edit" title="Edit">
                      <Pencil className="size-4" />
                    </Link>
                    <ActionButton
                      action={deleteCoupon.bind(null, c.id)}
                      confirm={`Delete coupon ${c.code}?`}
                      success="Coupon deleted."
                      className="btn-ghost !p-2 text-rose-600 hover:!bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
