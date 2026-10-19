import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { CustomerForm } from "@/components/admin/simple-forms";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/status-badge";
import { formatDate, money } from "@/lib/format";

export default async function EditCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const id = Number((await params).id);
  const [customer, customerOrders] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { id: true, name: true, email: true, phone: true, address: true, city: true, isAdmin: true, createdAt: true },
    }),
    db.query.orders.findMany({ where: eq(orders.userId, id), orderBy: desc(orders.createdAt), limit: 10 }),
  ]);
  if (!customer) notFound();

  return (
    <>
      <PageHeader title={customer.name} description={`Customer since ${formatDate(customer.createdAt)}`} crumbs={[{ href: "/admin/customers", label: "Customers" }]} />
      <CustomerForm customer={customer} />
      <Panel title="Recent orders" className="mt-6">
        <Table head={["Order", "Total", "Status", "Date"]} empty={customerOrders.length === 0}>
          {customerOrders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-slate-900 hover:text-brand-600">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="font-medium">{money(o.total)}</td>
              <td>
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="text-slate-500">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
