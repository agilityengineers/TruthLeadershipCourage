import { clearSession } from "@/lib/session";

/**
 * Client auth actions. Login now happens via the generated `useLogin` mutation
 * in the login form (which persists the session token). These helpers cover the
 * remaining auth surface.
 */
export function logoutAction() {
  clearSession();
}

/** Corporate SSO is not available in the demo build. */
export function ssoLoginAction() {
  return { error: "SSO is not configured in this demo." };
}
