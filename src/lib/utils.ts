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

export function daysUntil(d: Date | string) {
  const target = new Date(d).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
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
