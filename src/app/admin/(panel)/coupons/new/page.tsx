import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/simple-forms";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <>
      <PageHeader title="New coupon" crumbs={[{ href: "/admin/coupons", label: "Coupons" }]} />
      <CouponForm />
    </>
  );
}
