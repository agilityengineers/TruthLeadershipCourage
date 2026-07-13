import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pillar → hex, matching the design tokens. */
export const PILLAR_COLOR: Record<string, string> = {
  EQ: "#024794",
  IQ: "#262161",
  MQ: "#662d91",
};

/** Pillar → human label. */
export const PILLAR_LABEL: Record<string, string> = {
  EQ: "EQ",
  IQ: "IQ",
  MQ: "MQ™",
};

export function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(d),
  );
}

/**
 * Format a date-only field (cohort/session boundaries, enroll-by, portal close)
 * pinned to UTC, so the stored calendar day renders the same in every viewer
 * timezone. Same opts contract as formatDate; timeZone is always forced to UTC.
 */
export function formatDateOnly(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    ...(opts ?? { month: "short", day: "numeric", year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(d));
}

/** Whole calendar days from the viewer's local today until a date-only field's UTC day (never negative). */
export function daysUntil(d: Date | string) {
  const t = new Date(d);
  const targetDay = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((targetDay - today) / 86_400_000));
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
