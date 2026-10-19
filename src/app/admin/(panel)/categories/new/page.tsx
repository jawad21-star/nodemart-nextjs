import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader title="New category" crumbs={[{ href: "/admin/categories", label: "Categories" }]} />
      <CategoryForm />
    </>
  );
}
