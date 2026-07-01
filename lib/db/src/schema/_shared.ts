import { randomUUID } from "node:crypto";
import { pgEnum, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Shared primitives for the TLC schema: enum definitions (ported 1:1 from the
 * former in-memory `@/data/types` constants), an id generator, and common
 * timestamp column helpers.
 */

/** Generate a stable, prefixed id for a newly-created row. */
export function genId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/** A text primary key that auto-generates a prefixed id when omitted. */
export const idPk = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => genId(prefix));

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());

// ---------------------------------------------------------------------------
// Enums (values mirror the former `@/data/types` constant objects exactly)
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum("role", [
  "PARTICIPANT",
  "COMPANY_VIEWER",
  "TRAINER",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const companyStatusEnum = pgEnum("company_status", ["ACTIVE", "PROSPECT", "ARCHIVED"]);

export const pillarEnum = pgEnum("pillar", ["EQ", "IQ", "MQ"]);

export const cohortStatusEnum = pgEnum("cohort_status", [
  "DRAFT",
  "ENROLLING",
  "RUNNING",
  "COMPLETED",
  "ARCHIVED",
]);

export const eventTypeEnum = pgEnum("event_type", ["KICKOFF", "WEEKLY_SESSION", "COACHING_1ON1"]);

export const resourceTypeEnum = pgEnum("resource_type", ["PDF", "MP4", "LINK", "WORKBOOK"]);

export const resourceStatusEnum = pgEnum("resource_status", ["DRAFT", "PUBLISHED"]);

export const seatStatusEnum = pgEnum("seat_status", ["AVAILABLE", "ASSIGNED", "CONSUMED"]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "WITHDRAWN",
  "WAITLISTED",
]);

export const paymentProcessorEnum = pgEnum("payment_processor", ["STRIPE", "THRIVECART", "MANUAL"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "FAILED",
]);

export const couponTypeEnum = pgEnum("coupon_type", ["PERCENT", "FIXED"]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "PENDING",
  "PRINTING",
  "SHIPPED",
  "DELIVERED",
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "WAITING",
  "OFFERED",
  "CONVERTED",
  "EXPIRED",
]);

export const progressStatusEnum = pgEnum("progress_status", ["LOCKED", "AVAILABLE", "COMPLETED"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "SCHEDULED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

export const threadTypeEnum = pgEnum("thread_type", ["DIRECT", "COHORT_CHANNEL"]);

export const emailScopeEnum = pgEnum("email_scope", ["SYSTEM", "ADMIN", "TRAINER"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "NEW_MATERIAL",
  "NEW_MESSAGE",
  "UPCOMING_SESSION",
  "SHIPMENT_UPDATE",
  "ENROLLMENT",
  "GENERIC",
]);
