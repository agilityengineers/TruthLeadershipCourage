import type { Role } from "@/data/types";
import type { Principal } from "./scope";
import { can, type Capability, homeForRole } from "./rbac";

/**
 * Client-side session. The server validates the email + the account's own
 * password and returns a bearer token; we persist the returned user + token in
 * localStorage. The token is attached to every API request (see
 * `setAuthTokenGetter` in main.tsx). Route-level guards read the cached user
 * synchronously so <RequireRole> in App.tsx stays simple.
 */

const KEY = "tlc.session";
const TOKEN_KEY = "tlc.token";
// While an admin impersonates another user, their own session is stashed
// here so "Exit impersonation" can restore it without a fresh login.
const IMPERSONATOR_KEY = "tlc.impersonator.session";
const IMPERSONATOR_TOKEN_KEY = "tlc.impersonator.token";

export type SessionUser = {
  id: string;
  role: Role;
  companyId: string | null;
  name: string | null;
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

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(user: SessionUser, token: string) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("tlc:session"));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  // Full sign-out must never leave a stale stashed admin token behind.
  window.localStorage.removeItem(IMPERSONATOR_KEY);
  window.localStorage.removeItem(IMPERSONATOR_TOKEN_KEY);
  window.dispatchEvent(new Event("tlc:session"));
}

export function isImpersonating(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(IMPERSONATOR_TOKEN_KEY) !== null;
}

export function getImpersonatorUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IMPERSONATOR_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** Stash the current (admin) session, then swap the active session to the target's. */
export function startImpersonation(user: SessionUser, token: string) {
  if (isImpersonating()) throw new Error("Already impersonating another user.");
  const current = getSessionUser();
  const currentToken = getToken();
  if (!current || !currentToken) throw new Error("No active session to return to.");
  window.localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(current));
  window.localStorage.setItem(IMPERSONATOR_TOKEN_KEY, currentToken);
  setSession(user, token);
}

/** Drop the impersonated session and restore the stashed admin session. */
export function stopImpersonation() {
  const admin = getImpersonatorUser();
  const adminToken = window.localStorage.getItem(IMPERSONATOR_TOKEN_KEY);
  window.localStorage.removeItem(IMPERSONATOR_KEY);
  window.localStorage.removeItem(IMPERSONATOR_TOKEN_KEY);
  if (admin && adminToken) setSession(admin, adminToken);
  else clearSession(); // corrupted stash — fail safe to signed-out
}

export function getPrincipal(): Principal | null {
  const u = getSessionUser();
  if (!u) return null;
  return { id: u.id, role: u.role, companyId: u.companyId ?? null };
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
