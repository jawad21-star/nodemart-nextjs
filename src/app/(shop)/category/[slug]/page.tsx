import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopHeader, ShopResults, ShopResultsSkeleton } from "@/components/shop/shop-view";
import { getCategoryBySlug } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">) {
  const category = await getCategoryBySlug((await params).slug);
  return { title: category?.name ?? "Category" };
}

async function CategoryView({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <ShopHeader title={category.name} description={category.description} crumb={category.name} />
      <Suspense fallback={<ShopResultsSkeleton />}>
        <ShopResults params={await searchParams} categorySlug={category.slug} />
      </Suspense>
    </>
  );
}

export default function CategoryPage(props: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<ShopResultsSkeleton />}>
      <CategoryView {...props} />
    </Suspense>
  );
}
