/**
 * Lightweight fixed-window rate limiter.
 *
 * NOTE ON AUTOSCALE: this store is in-process, so on Replit Autoscale (multiple
 * instances) the effective limit is per-instance, not global. It still meaningfully
 * blunts brute-force / spam from a single client hitting one instance, with zero
 * extra infrastructure. For a hard, cluster-wide guarantee, back this with a shared
 * store (e.g. Upstash/Redis) behind the same `rateLimit()` signature.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  /** Requests left in the current window (0 when blocked). */
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
};

/**
 * Record a hit against `key` and report whether it is allowed.
 * `now` is injectable for deterministic tests.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number; now?: number },
): RateLimitResult {
  const now = opts.now ?? Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

/** Test/maintenance helper: clear all buckets. */
export function __resetRateLimit() {
  store.clear();
}

/** Client-only build: no request headers available. */
export async function clientIp(): Promise<string> {
  return "client";
}
