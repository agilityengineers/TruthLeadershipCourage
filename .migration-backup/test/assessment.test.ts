import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSnapshot, type QuestionLite } from "../src/lib/assessment";

const q = (id: string, theme: string): QuestionLite => ({
  id,
  theme,
  pillar: "EQ",
  color: "#024794",
  prompt: `prompt ${id}`,
  benefit: `benefit ${id}`,
});

test("low scores (<=2) become growth cards; high (>=3) become strengths", () => {
  const questions = [q("a", "Self"), q("b", "Comms"), q("c", "Conflict")];
  const snap = computeSnapshot(questions, { a: 1, b: 4, c: 2 });

  assert.deepEqual(
    snap.growth.map((g) => g.theme).sort(),
    ["Conflict", "Self"],
  );
  assert.deepEqual(snap.strengths, ["Comms"]);
  assert.equal(snap.growth[0].benefit.startsWith("benefit"), true);
});

test("unanswered questions (0 / missing) count as neither", () => {
  const questions = [q("a", "Self"), q("b", "Comms")];
  const snap = computeSnapshot(questions, { a: 0 });
  assert.equal(snap.growth.length, 0);
  assert.equal(snap.strengths.length, 0);
});

test("growth card falls back to a pillar color when none provided", () => {
  const questions: QuestionLite[] = [{ ...q("a", "Self"), color: "" }];
  const snap = computeSnapshot(questions, { a: 1 });
  assert.equal(snap.growth[0].color, "#024794");
});
