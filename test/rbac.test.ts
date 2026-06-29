import { test } from "node:test";
import assert from "node:assert/strict";
import { can, homeForRole } from "../src/lib/rbac";

test("participant has portal access but not billing", () => {
  assert.equal(can("PARTICIPANT", "portal:view"), true);
  assert.equal(can("PARTICIPANT", "chat:participate"), true);
  assert.equal(can("PARTICIPANT", "billing:manage"), false);
  assert.equal(can("PARTICIPANT", "cohort:manage"), false);
});

test("trainer can manage resources/events but not billing or companies", () => {
  assert.equal(can("TRAINER", "resource:manage"), true);
  assert.equal(can("TRAINER", "event:manage"), true);
  assert.equal(can("TRAINER", "billing:manage"), false);
  assert.equal(can("TRAINER", "company:manage"), false);
});

test("admin has the full operational matrix", () => {
  assert.equal(can("ADMIN", "billing:manage"), true);
  assert.equal(can("ADMIN", "assessment:manage"), true);
  assert.equal(can("ADMIN", "company:manage"), true);
});

test("super admin is allowed everything via admin:all", () => {
  assert.equal(can("SUPER_ADMIN", "billing:manage"), true);
  assert.equal(can("SUPER_ADMIN", "portal:view"), true);
  assert.equal(can("SUPER_ADMIN", "analytics:view"), true);
});

test("undefined role is denied", () => {
  assert.equal(can(undefined, "portal:view"), false);
});

test("homeForRole routes each role to its dashboard", () => {
  assert.equal(homeForRole("ADMIN"), "/admin");
  assert.equal(homeForRole("SUPER_ADMIN"), "/admin");
  assert.equal(homeForRole("TRAINER"), "/trainer");
  assert.equal(homeForRole("COMPANY_VIEWER"), "/company");
  assert.equal(homeForRole("PARTICIPANT"), "/portal");
  assert.equal(homeForRole(undefined), "/portal");
});
