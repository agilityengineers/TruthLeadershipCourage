import type { Request } from "express";
import { db, schema, eq } from "./db";
import { HttpError, unauthorized, forbidden } from "./http";
import { can, type Capability, type Role } from "./rbac";

export type Principal = {
  id: string;
  role: Role;
  companyId: string | null;
  /** Set when this session is an admin impersonating `id`. */
  impersonatorId: string | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal | null;
    }
  }
}

function readToken(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const header = req.headers["x-session-token"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return null;
}

/**
 * Resolve the current principal from the session token, if any. Populates
 * `req.principal`. Never throws — routes decide whether auth is required.
 */
export async function loadPrincipal(req: Request): Promise<Principal | null> {
  if (req.principal !== undefined) return req.principal;
  const token = readToken(req);
  if (!token) {
    req.principal = null;
    return null;
  }
  const row = await db.query.session.findFirst({
    where: eq(schema.session.sessionToken, token),
    with: { user: true },
  });
  if (!row || row.expires.getTime() < Date.now() || !row.user) {
    req.principal = null;
    return null;
  }
  req.principal = {
    id: row.user.id,
    role: row.user.role as Role,
    companyId: row.user.companyId ?? null,
    impersonatorId: row.impersonatorId ?? null,
  };
  return req.principal;
}

/** Require an authenticated principal or throw 401. */
export async function requirePrincipal(req: Request): Promise<Principal> {
  const p = await loadPrincipal(req);
  if (!p) throw unauthorized();
  return p;
}

/** Require one of the given roles (SUPER_ADMIN always passes). */
export async function requireRole(req: Request, ...roles: Role[]): Promise<Principal> {
  const p = await requirePrincipal(req);
  if (!roles.includes(p.role) && p.role !== "SUPER_ADMIN") throw forbidden();
  return p;
}

/** Require a capability or throw 403. */
export async function requireCapability(req: Request, cap: Capability): Promise<Principal> {
  const p = await requirePrincipal(req);
  if (!can(p.role, cap)) throw forbidden();
  return p;
}

/** Throw 403 if a principal may not act outside their own company. */
export function assertSameTenant(p: Principal, companyId: string | null) {
  if (p.role === "ADMIN" || p.role === "SUPER_ADMIN") return;
  if (p.companyId && companyId && p.companyId === companyId) return;
  throw new HttpError(403, "Forbidden: cross-tenant access");
}
