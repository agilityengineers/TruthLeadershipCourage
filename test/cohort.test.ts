import { test } from "node:test";
import assert from "node:assert/strict";
import { derivePhase, currentWeek, progressPct } from "../src/lib/cohort";

const start = new Date("2026-08-13T16:00:00Z");
const end = new Date("2027-02-25T19:00:00Z");

test("derivePhase: before / during / after relative to now", () => {
  assert.equal(derivePhase(start, end, new Date("2026-07-01T00:00:00Z")), "before");
  assert.equal(derivePhase(start, end, new Date("2026-10-01T00:00:00Z")), "during");
  assert.equal(derivePhase(start, end, new Date("2027-04-01T00:00:00Z")), "after");
});

test("currentWeek is 1-based and clamped to [1, totalWeeks]", () => {
  assert.equal(currentWeek(start, 24, start), 1);
  assert.equal(currentWeek(start, 24, new Date("2026-07-01T00:00:00Z")), 1); // before start clamps to 1
  // ~3 weeks in
  assert.equal(currentWeek(start, 24, new Date("2026-09-03T16:00:00Z")), 4);
  // far past end clamps to total
  assert.equal(currentWeek(start, 24, new Date("2030-01-01T00:00:00Z")), 24);
});

test("progressPct rounds and guards zero total", () => {
  assert.equal(progressPct(0, 24), 0);
  assert.equal(progressPct(12, 24), 50);
  assert.equal(progressPct(24, 24), 100);
  assert.equal(progressPct(1, 24), 4); // 4.16 -> 4
  assert.equal(progressPct(5, 0), 0);
});
