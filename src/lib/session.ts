import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import type { Principal } from "./scope";
import { can, type Capability, homeForRole } from "./rbac";

/** Resolve the current principal (tenant-scoping subject) or null. */
export async function getPrincipal(): Promise<Principal | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    companyId: session.user.companyId ?? null,
  };
}

/** Require an authenticated principal; redirect to /login otherwise. */
export async function requirePrincipal(): Promise<Principal> {
  const p = await getPrincipal();
  if (!p) redirect("/login");
  return p;
}

/** Require one of the given roles; bounce to the role's home if mismatched. */
export async function requireRole(...roles: Role[]): Promise<Principal> {
  const p = await requirePrincipal();
  if (!roles.includes(p.role) && p.role !== "SUPER_ADMIN") {
    redirect(homeForRole(p.role));
  }
  return p;
}

/** Require a capability; throw (caught by error boundary) if missing. */
export async function requireCapability(cap: Capability): Promise<Principal> {
  const p = await requirePrincipal();
  if (!can(p.role, cap)) redirect(homeForRole(p.role));
  return p;
}
