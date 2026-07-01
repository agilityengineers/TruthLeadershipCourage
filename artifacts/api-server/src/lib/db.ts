/** Re-export the Drizzle client, schema tables, and common ORM helpers. */
export { db, pool } from "@workspace/db";
export * as schema from "@workspace/db";
export {
  eq,
  and,
  or,
  ne,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  gt,
  gte,
  lt,
  lte,
  desc,
  asc,
  sql,
  count,
} from "drizzle-orm";
