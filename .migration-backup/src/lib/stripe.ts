import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe client. Backend-only — never imported by client components or any
 * participant/marketing surface. Returns null when unconfigured so dev flows
 * (and ThriveCart-only setups) don't crash.
 */
export const stripe: Stripe | null = KEY ? new Stripe(KEY) : null;

export function isStripeConfigured() {
  return Boolean(KEY);
}
