import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { productFormOptions } from "@/lib/admin-data";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, options] = await Promise.all([db.query.products.findFirst({ where: eq(products.id, Number(id)) }), productFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        crumbs={[{ href: "/admin/products", label: "Products" }]}
        actions={
          <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline !rounded-lg">
            <ExternalLink className="size-4" /> View in store
          </Link>
        }
      />
      <ProductForm product={product} {...options} />
    </>
  );
}
