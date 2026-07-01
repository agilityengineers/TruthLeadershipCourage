/** Roles × capabilities, ported from the app's lib/rbac.ts. */
export type Role =
  | "PARTICIPANT"
  | "COMPANY_VIEWER"
  | "TRAINER"
  | "ADMIN"
  | "SUPER_ADMIN";

export type Capability =
  | "portal:view"
  | "company:viewProgress"
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
  | "user:manage"
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
  ],
  SUPER_ADMIN: ["admin:all"],
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  const caps = MATRIX[role] ?? [];
  return caps.includes("admin:all") || caps.includes(cap);
}

export function homeForRole(role: Role | undefined): string {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    case "TRAINER":
      return "/trainer";
    case "COMPANY_VIEWER":
      return "/company";
    default:
      return "/portal";
  }
}
