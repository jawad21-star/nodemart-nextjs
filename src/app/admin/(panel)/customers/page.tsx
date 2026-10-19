import { and, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { qualified } from "@/db/sql";
import { orders, users } from "@/db/schema";
import { deleteCustomer } from "@/actions/admin";
import { ActionButton } from "@/components/admin/controls";
import { FilterSelect, PageHeader, Panel, Table, Toolbar } from "@/components/admin/ui";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

const PER_PAGE = 15;

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const me = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role = typeof params.role === "string" ? params.role : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: (SQL | undefined)[] = [];
  if (q) where.push(or(like(users.name, `%${q}%`), like(users.email, `%${q}%`), like(users.phone, `%${q}%`)));
  if (role === "admin") where.push(eq(users.isAdmin, true));
  if (role === "customer") where.push(eq(users.isAdmin, false));
  const condition = and(...where);

  const [rows, total] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        city: users.city,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        orderCount: sql<number>`(select count(*) from ${orders} where ${qualified(orders.userId)} = ${qualified(users.id)})`,
        spent: sql<number>`(select coalesce(sum(${qualified(orders.total)}), 0) from ${orders} where ${qualified(orders.userId)} = ${qualified(users.id)} and ${qualified(orders.status)} != 'cancelled')`,
      })
      .from(users)
      .where(condition)
      .orderBy(desc(users.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.$count(users, condition),
  ]);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${total} accounts`}
        actions={
          <Link href="/admin/customers/new" className="btn-brand !rounded-lg">
            <Plus className="size-4" /> New customer
          </Link>
        }
      />
      <Panel>
        <Toolbar action="/admin/customers" q={q} placeholder="Name, email or phone…">
          <FilterSelect
            name="role"
            value={role}
            label="All roles"
            options={[
              { value: "customer", label: "Customers" },
              { value: "admin", label: "Admins" },
            ]}
          />
        </Toolbar>
        <Table head={["Customer", "Phone", "City", "Orders", "Total spent", "Joined", ""]} empty={rows.length === 0}>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{u.name.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <Link href={`/admin/customers/${u.id}`} className="font-medium whitespace-nowrap text-slate-900 hover:text-brand-600">
                      {u.name}
                    </Link>
                    {u.isAdmin && (
                      <span className="ml-2">
                        <Badge color="brand">Admin</Badge>
                      </span>
                    )}
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap text-slate-600">{u.phone ?? "—"}</td>
              <td className="text-slate-600">{u.city ?? "—"}</td>
              <td>
                <Badge>{u.orderCount}</Badge>
              </td>
              <td className="font-medium whitespace-nowrap">{money(u.spent)}</td>
              <td className="whitespace-nowrap text-slate-500">{formatDate(u.createdAt)}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/customers/${u.id}`} className="btn-ghost !p-2" aria-label="Edit" title="Edit">
                    <Pencil className="size-4" />
                  </Link>
                  {u.id !== me.id && (
                    <ActionButton
                      action={deleteCustomer.bind(null, u.id)}
                      confirm={`Delete ${u.name}'s account? Their orders are kept as guest orders.`}
                      success="Account deleted."
                      className="btn-ghost !p-2 text-rose-600 hover:!bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        <div className="pb-6">
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} params={params} basePath="/admin/customers" />
        </div>
      </Panel>
    </>
  );
}
