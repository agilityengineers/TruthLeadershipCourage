/**
 * Domain types + enum-like constants for the TLC platform.
 * Replaces the generated `@prisma/client` types after the migration to a
 * client-side in-memory data layer. Each enum is exported as BOTH a value
 * object and a type of the same name (declaration merging) so existing code
 * that does `Pillar.EQ` (value) or `role: Role` (type) keeps working.
 */

export const Role = {
  PARTICIPANT: "PARTICIPANT",
  COMPANY_VIEWER: "COMPANY_VIEWER",
  TRAINER: "TRAINER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CompanyStatus = { ACTIVE: "ACTIVE", PROSPECT: "PROSPECT", ARCHIVED: "ARCHIVED" } as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

export const Pillar = { EQ: "EQ", IQ: "IQ", MQ: "MQ" } as const;
export type Pillar = (typeof Pillar)[keyof typeof Pillar];

export const CohortStatus = {
  DRAFT: "DRAFT",
  ENROLLING: "ENROLLING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;
export type CohortStatus = (typeof CohortStatus)[keyof typeof CohortStatus];

export const EventType = { KICKOFF: "KICKOFF", WEEKLY_SESSION: "WEEKLY_SESSION", COACHING_1ON1: "COACHING_1ON1" } as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const ResourceType = { PDF: "PDF", MP4: "MP4", LINK: "LINK", WORKBOOK: "WORKBOOK" } as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const ResourceStatus = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED" } as const;
export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];

export const SeatStatus = { AVAILABLE: "AVAILABLE", ASSIGNED: "ASSIGNED", CONSUMED: "CONSUMED" } as const;
export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];

export const EnrollmentStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  WITHDRAWN: "WITHDRAWN",
  WAITLISTED: "WAITLISTED",
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const PaymentProcessor = { STRIPE: "STRIPE", THRIVECART: "THRIVECART", MANUAL: "MANUAL" } as const;
export type PaymentProcessor = (typeof PaymentProcessor)[keyof typeof PaymentProcessor];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const CouponType = { PERCENT: "PERCENT", FIXED: "FIXED" } as const;
export type CouponType = (typeof CouponType)[keyof typeof CouponType];

export const ShipmentStatus = { PENDING: "PENDING", PRINTING: "PRINTING", SHIPPED: "SHIPPED", DELIVERED: "DELIVERED" } as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const WaitlistStatus = { WAITING: "WAITING", OFFERED: "OFFERED", CONVERTED: "CONVERTED", EXPIRED: "EXPIRED" } as const;
export type WaitlistStatus = (typeof WaitlistStatus)[keyof typeof WaitlistStatus];

export const ProgressStatus = { LOCKED: "LOCKED", AVAILABLE: "AVAILABLE", COMPLETED: "COMPLETED" } as const;
export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus];

export const BookingStatus = { SCHEDULED: "SCHEDULED", RESCHEDULED: "RESCHEDULED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED" } as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ThreadType = { DIRECT: "DIRECT", COHORT_CHANNEL: "COHORT_CHANNEL" } as const;
export type ThreadType = (typeof ThreadType)[keyof typeof ThreadType];

export const EmailScope = { SYSTEM: "SYSTEM", ADMIN: "ADMIN", TRAINER: "TRAINER" } as const;
export type EmailScope = (typeof EmailScope)[keyof typeof EmailScope];

export const NotificationType = {
  NEW_MATERIAL: "NEW_MATERIAL",
  NEW_MESSAGE: "NEW_MESSAGE",
  UPCOMING_SESSION: "UPCOMING_SESSION",
  SHIPMENT_UPDATE: "SHIPMENT_UPDATE",
  ENROLLMENT: "ENROLLMENT",
  GENERIC: "GENERIC",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** Generic dynamic shapes used by the in-memory query engine. */
export type WhereInput = Record<string, any>;
export type Json = any;

/** Loose Prisma-namespace shim so legacy `Prisma.XWhereInput` references compile. */
export type Prisma = any;
export namespace Prisma {
  export type EnrollmentWhereInput = WhereInput;
  export type CohortWhereInput = WhereInput;
  export type UserWhereInput = WhereInput;
  export type CompanyWhereInput = WhereInput;
  export type PaymentWhereInput = WhereInput;
  export type ResourceWhereInput = WhereInput;
  export type EventWhereInput = WhereInput;
  export type MessageWhereInput = WhereInput;
  export type ThreadWhereInput = WhereInput;
  export type InputJsonValue = any;
  export type JsonValue = any;
}
