/**
 * Stripe is not available in this client-only demo build. These shims keep
 * call sites compiling; billing flows operate on the in-memory store instead.
 */
export const stripe: any = null;

export function isStripeConfigured() {
  return false;
}
