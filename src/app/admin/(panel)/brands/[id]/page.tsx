import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { BrandForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export default async function EditBrandPage({ params }: PageProps<"/admin/brands/[id]">) {
  const brand = await db.query.brands.findFirst({ where: eq(brands.id, Number((await params).id)) });
  if (!brand) notFound();

  return (
    <>
      <PageHeader title={brand.name} crumbs={[{ href: "/admin/brands", label: "Brands" }]} />
      <BrandForm brand={brand} />
    </>
  );
}
