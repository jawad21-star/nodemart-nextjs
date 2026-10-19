import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopHeader, ShopResults, ShopResultsSkeleton } from "@/components/shop/shop-view";

export const metadata: Metadata = { title: "Shop" };

async function Heading({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const { q, sale } = await searchParams;
  const title = q ? `Results for “${q}”` : sale === "1" ? "On sale" : "All products";
  return <ShopHeader title={title} />;
}

async function Results({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  return <ShopResults params={await searchParams} />;
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <Suspense fallback={<ShopHeader title="All products" />}>
        <Heading searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ShopResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}
