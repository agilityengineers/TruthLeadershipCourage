import { db, schema, eq, and, inArray, or, sql } from "./db";
import type { SQL } from "drizzle-orm";
import type { Principal } from "./principal";

/**
 * Tenant scoping. Each helper returns a Drizzle `where` condition (or undefined
 * for unrestricted admins) restricting a query to the rows a principal may see.
 * Ported from the app's lib/scope.ts.
 */
export function enrollmentScope(p: Principal): SQL | undefined {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return undefined;
    case "TRAINER":
      return inArray(
        schema.enrollment.cohortId,
        db.select({ id: schema.cohort.id }).from(schema.cohort).where(eq(schema.cohort.trainerId, p.id)),
      );
    case "COMPANY_VIEWER":
      return eq(schema.enrollment.companyId, p.companyId ?? "__none__");
    case "PARTICIPANT":
    default:
      return eq(schema.enrollment.userId, p.id);
  }
}

export function cohortScope(p: Principal): SQL | undefined {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return undefined;
    case "TRAINER":
      return eq(schema.cohort.trainerId, p.id);
    case "COMPANY_VIEWER":
      return or(
        eq(schema.cohort.companyId, p.companyId ?? "__none__"),
        inArray(
          schema.cohort.id,
          db
            .select({ id: schema.enrollment.cohortId })
            .from(schema.enrollment)
            .where(eq(schema.enrollment.companyId, p.companyId ?? "__none__")),
        ),
      );
    case "PARTICIPANT":
    default:
      return inArray(
        schema.cohort.id,
        db.select({ id: schema.enrollment.cohortId }).from(schema.enrollment).where(eq(schema.enrollment.userId, p.id)),
      );
  }
}

export function userScope(p: Principal): SQL | undefined {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return undefined;
    case "TRAINER":
      return inArray(
        schema.user.id,
        db
          .select({ id: schema.enrollment.userId })
          .from(schema.enrollment)
          .innerJoin(schema.cohort, eq(schema.enrollment.cohortId, schema.cohort.id))
          .where(eq(schema.cohort.trainerId, p.id)),
      );
    case "COMPANY_VIEWER":
      return eq(schema.user.companyId, p.companyId ?? "__none__");
    case "PARTICIPANT":
    default:
      return eq(schema.user.id, p.id);
  }
}

/** Combine a scope condition with an extra condition (both optional). */
export function withScope(scope: SQL | undefined, extra: SQL | undefined): SQL | undefined {
  if (scope && extra) return and(scope, extra);
  return scope ?? extra;
}

export { sql };
