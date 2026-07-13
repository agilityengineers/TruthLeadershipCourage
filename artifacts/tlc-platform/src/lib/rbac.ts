import type { Role } from "@/data/types";

/**
 * Roles × permissions. Capabilities are coarse-grained verbs the UI and
 * server actions check. Row-level/tenant scoping is enforced separately in the
 * data-access layer (see scope.ts) — this only answers "is this verb allowed".
 */
export type Capability =
  | "portal:view" // own participant portal
  | "company:viewProgress" // read-only view of a company's participants
  | "chat:participate"
  | "resource:manage"
  | "event:manage"
  | "cohort:manage"
  | "company:manage"
  | "trainer:manage"
  | "assessment:manage"
  | "billing:manage"
  | "content:manage"
  | "email:send"
  | "analytics:view"
  | "user:manage" // create/edit/deactivate/delete platform users
  | "user:impersonate" // troubleshoot as another (non-admin) user
  | "admin:all";

const MATRIX: Record<Role, Capability[]> = {
  PARTICIPANT: ["portal:view", "chat:participate"],
  COMPANY_VIEWER: ["company:viewProgress", "analytics:view"],
  TRAINER: [
    "chat:participate",
    "resource:manage",
    "event:manage",
    "email:send",
    "company:viewProgress",
    "analytics:view",
  ],
  ADMIN: [
    "portal:view",
    "company:viewProgress",
    "chat:participate",
    "resource:manage",
    "event:manage",
    "cohort:manage",
    "company:manage",
    "trainer:manage",
    "assessment:manage",
    "billing:manage",
    "content:manage",
    "email:send",
    "analytics:view",
    "user:manage",
    "user:impersonate",
  ],
  SUPER_ADMIN: ["admin:all"],
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  const caps = MATRIX[role] ?? [];
  return caps.includes("admin:all") || caps.includes(cap);
}

/** Default landing route per role after login. */
export function homeForRole(role: Role | undefined): string {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    case "TRAINER":
      return "/trainer";
    case "COMPANY_VIEWER":
      return "/company";
    case "PARTICIPANT":
    default:
      return "/portal";
  }
}
