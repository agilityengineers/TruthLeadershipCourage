import type { Role } from "@/data/types";
import type { Principal } from "./scope";
import { can, type Capability, homeForRole } from "./rbac";
import { store } from "@/data/store";

/**
 * Client-side session. The original app used NextAuth (server). In this
 * migrated SPA we persist the chosen demo user in localStorage and expose
 * synchronous guards. Route-level access control lives in <RequireRole> in
 * App.tsx, so these guards normally just return the current principal.
 */

const KEY = "tlc.session";

export type SessionUser = {
  id: string;
  role: Role;
  companyId: string | null;
  name: string;
  email: string;
};

function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + path;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("tlc:session"));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tlc:session"));
}

export function getPrincipal(): Principal | null {
  const u = getSessionUser();
  if (!u) return null;
  return { id: u.id, role: u.role, companyId: u.companyId ?? null };
}

/** Demo credential login: any seeded user with the shared demo password. */
export function login(email: string, password: string): { ok: boolean; error?: string; user?: SessionUser } {
  const found = store.user.find((u) => String(u.email).toLowerCase() === email.toLowerCase());
  if (!found || password !== "password123") {
    return { ok: false, error: "Invalid email or password." };
  }
  const user: SessionUser = {
    id: found.id,
    role: found.role,
    companyId: found.companyId ?? null,
    name: found.name,
    email: found.email,
  };
  setSession(user);
  return { ok: true, user };
}

export function logout() {
  clearSession();
}

/** Require an authenticated principal; bounce to /login otherwise. */
export function requirePrincipal(): Principal {
  const p = getPrincipal();
  if (!p) {
    if (typeof window !== "undefined") window.location.href = withBase("/login");
    throw new Error("Not authenticated");
  }
  return p;
}

/** Require one of the given roles; bounce to the role's home if mismatched. */
export function requireRole(...roles: Role[]): Principal {
  const p = requirePrincipal();
  if (!roles.includes(p.role) && p.role !== "SUPER_ADMIN") {
    if (typeof window !== "undefined") window.location.href = withBase(homeForRole(p.role));
    throw new Error("Forbidden");
  }
  return p;
}

/** Require a capability; bounce to the role's home if missing. */
export function requireCapability(cap: Capability): Principal {
  const p = requirePrincipal();
  if (!can(p.role, cap)) {
    if (typeof window !== "undefined") window.location.href = withBase(homeForRole(p.role));
    throw new Error("Forbidden");
  }
  return p;
}
