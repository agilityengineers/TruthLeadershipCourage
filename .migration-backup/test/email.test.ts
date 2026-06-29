import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTemplate } from "../src/lib/email";

test("renderTemplate substitutes {{var}} placeholders", () => {
  const out = renderTemplate("Welcome {{firstName}} to {{cohortName}}", {
    firstName: "Jordan",
    cohortName: "Fall 2026",
  });
  assert.equal(out, "Welcome Jordan to Fall 2026");
});

test("renderTemplate tolerates whitespace in braces and coerces numbers", () => {
  assert.equal(renderTemplate("Seats: {{ count }}", { count: 12 }), "Seats: 12");
});

test("renderTemplate renders missing keys as empty string", () => {
  assert.equal(renderTemplate("Hi {{missing}}!", {}), "Hi !");
});
