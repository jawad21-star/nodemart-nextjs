import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { CouponForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export default async function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.id, Number((await params).id)) });
  if (!coupon) notFound();

  return (
    <>
      <PageHeader title={coupon.code} crumbs={[{ href: "/admin/coupons", label: "Coupons" }]} />
      <CouponForm coupon={coupon} />
    </>
  );
}
