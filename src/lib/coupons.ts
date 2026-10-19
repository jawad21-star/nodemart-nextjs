import type { Coupon } from "@/db/schema";
import { money } from "./format";

/** Returns an error message, or null when the coupon can be applied to the subtotal. */
export function couponError(coupon: Coupon, subtotal: number, now = new Date()): string | null {
  if (!coupon.isActive) return "This coupon is not active.";
  if (coupon.expiresAt && coupon.expiresAt < now) return "This coupon has expired.";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return "This coupon has reached its usage limit.";
  if (coupon.minAmount !== null && subtotal < coupon.minAmount) {
    return `Minimum order of ${money(coupon.minAmount)} required for this coupon.`;
  }
  return null;
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  const discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(discount, subtotal);
}
