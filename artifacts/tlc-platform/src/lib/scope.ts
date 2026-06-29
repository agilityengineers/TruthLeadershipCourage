import type { Role, Prisma } from "@/data/types";

export type Principal = {
  id: string;
  role: Role;
  companyId: string | null;
};

/**
 * Tenant scoping. Returns a Prisma `where` fragment that restricts a query to
 * the rows a principal is allowed to see. Admins/super-admins are unrestricted;
 * everyone else is bound to their company / assignment.
 */
export function enrollmentScope(p: Principal): Prisma.EnrollmentWhereInput {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return {};
    case "TRAINER":
      return { cohort: { trainerId: p.id } };
    case "COMPANY_VIEWER":
      return { companyId: p.companyId ?? "__none__" };
    case "PARTICIPANT":
    default:
      return { userId: p.id };
  }
}

export function cohortScope(p: Principal): Prisma.CohortWhereInput {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return {};
    case "TRAINER":
      return { trainerId: p.id };
    case "COMPANY_VIEWER":
      return { OR: [{ companyId: p.companyId ?? "__none__" }, { enrollments: { some: { companyId: p.companyId ?? "__none__" } } }] };
    case "PARTICIPANT":
    default:
      return { enrollments: { some: { userId: p.id } } };
  }
}

export function userScope(p: Principal): Prisma.UserWhereInput {
  switch (p.role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return {};
    case "TRAINER":
      return { enrollments: { some: { cohort: { trainerId: p.id } } } };
    case "COMPANY_VIEWER":
      return { companyId: p.companyId ?? "__none__" };
    case "PARTICIPANT":
    default:
      return { id: p.id };
  }
}

/** Guard helper: throw if a principal may not act outside their company. */
export function assertSameTenant(p: Principal, companyId: string | null) {
  if (p.role === "ADMIN" || p.role === "SUPER_ADMIN") return;
  if (p.companyId && companyId && p.companyId === companyId) return;
  throw new Error("Forbidden: cross-tenant access");
}
