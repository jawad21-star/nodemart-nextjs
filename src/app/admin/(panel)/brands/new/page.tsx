import type { Metadata } from "next";
import { BrandForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New brand" };

export default function NewBrandPage() {
  return (
    <>
      <PageHeader title="New brand" crumbs={[{ href: "/admin/brands", label: "Brands" }]} />
      <BrandForm />
    </>
  );
}
