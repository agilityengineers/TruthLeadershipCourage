import { login, logout } from "@/lib/session";
import { homeForRole } from "@/lib/rbac";

/**
 * Client auth actions (migrated from NextAuth server actions). The login page
 * calls `loginAction(email, password)` and navigates to the returned `redirectTo`.
 */
export function loginAction(email: string, password: string): { error: string | null; redirectTo?: string } {
  const result = login(String(email ?? "").toLowerCase(), String(password ?? ""));
  if (!result.ok) return { error: result.error ?? "Invalid email or password." };
  return { error: null, redirectTo: homeForRole(result.user!.role) };
}

export function logoutAction() {
  logout();
}

/** Corporate SSO is not available in the demo build. */
export function ssoLoginAction() {
  return { error: "SSO is not configured in this demo." };
}
