import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CategoryForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const category = await db.query.categories.findFirst({ where: eq(categories.id, Number((await params).id)) });
  if (!category) notFound();

  return (
    <>
      <PageHeader title={category.name} crumbs={[{ href: "/admin/categories", label: "Categories" }]} />
      <CategoryForm category={category} />
    </>
  );
}
