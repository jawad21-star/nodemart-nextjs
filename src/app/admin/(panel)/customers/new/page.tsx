import type { Metadata } from "next";
import { CustomerForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New customer" };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New customer" crumbs={[{ href: "/admin/customers", label: "Customers" }]} />
      <CustomerForm />
    </>
  );
}
