import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { productFormOptions } from "@/lib/admin-data";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const options = await productFormOptions();
  return (
    <>
      <PageHeader title="New product" crumbs={[{ href: "/admin/products", label: "Products" }]} />
      <ProductForm {...options} />
    </>
  );
}
