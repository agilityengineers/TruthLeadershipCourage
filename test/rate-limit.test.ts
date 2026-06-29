import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, __resetRateLimit } from "../src/lib/rate-limit";

test("allows up to the limit, then blocks within the window", () => {
  __resetRateLimit();
  const opts = { limit: 3, windowMs: 1000, now: 0 };

  assert.equal(rateLimit("k", opts).ok, true); // 1
  assert.equal(rateLimit("k", opts).ok, true); // 2
  const third = rateLimit("k", opts); // 3
  assert.equal(third.ok, true);
  assert.equal(third.remaining, 0);

  const blocked = rateLimit("k", opts); // 4 -> blocked
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remaining, 0);
});

test("resets after the window elapses", () => {
  __resetRateLimit();
  assert.equal(rateLimit("w", { limit: 1, windowMs: 1000, now: 0 }).ok, true);
  assert.equal(rateLimit("w", { limit: 1, windowMs: 1000, now: 500 }).ok, false);
  // window has passed
  assert.equal(rateLimit("w", { limit: 1, windowMs: 1000, now: 1001 }).ok, true);
});

test("tracks distinct keys independently", () => {
  __resetRateLimit();
  const opts = { limit: 1, windowMs: 1000, now: 0 };
  assert.equal(rateLimit("a", opts).ok, true);
  assert.equal(rateLimit("b", opts).ok, true);
  assert.equal(rateLimit("a", opts).ok, false);
});
