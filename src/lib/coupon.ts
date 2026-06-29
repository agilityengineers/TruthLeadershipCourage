import { db } from "./db";

export type CouponResult =
  | { valid: true; discountCents: number; couponId: string }
  | { valid: false; reason: string };

/** Validate a coupon code against a base price (cents). Backend-only. */
export async function evaluateCoupon(code: string, baseCents: number, cohortId?: string): Promise<CouponResult> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { valid: false, reason: "Invalid code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: "Expired" };
  if (coupon.cohortId && cohortId && coupon.cohortId !== cohortId)
    return { valid: false, reason: "Not valid for this cohort" };
  if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions)
    return { valid: false, reason: "Redemption limit reached" };

  const discount =
    coupon.type === "PERCENT"
      ? Math.round((baseCents * Math.min(coupon.value, 100)) / 100)
      : Math.min(coupon.value, baseCents);

  return { valid: true, discountCents: discount, couponId: coupon.id };
}
