import { useLogout } from "@workspace/api-client-react";
import {
  getImpersonatorUser,
  getSessionUser,
  isImpersonating,
  stopImpersonation,
} from "@/lib/session";

/**
 * Always-visible strip shown while an admin is impersonating another user.
 * Mounted once in DashboardShell so it covers every portal. Reads
 * localStorage synchronously — identity swaps are always full page loads,
 * so no subscription is needed.
 */
export function ImpersonationBanner() {
  const logout = useLogout();
  if (!isImpersonating()) return null;
  const target = getSessionUser();
  const admin = getImpersonatorUser();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function exit() {
    // Revoke the impersonated token first — the fetch mutator reads the
    // currently-active token, so this must run before stopImpersonation()
    // swaps the admin token back in. Best-effort: an already-expired token
    // still exits cleanly.
    try {
      await logout.mutateAsync();
    } catch {
      /* best-effort revoke */
    }
    stopImpersonation();
    // Full page navigation: fresh react-query cache, guards re-run against
    // the restored admin session.
    window.location.assign(`${base}/admin/users`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-[#e6cf8f] bg-[#fdf3d7] px-[clamp(18px,3vw,30px)] py-2 text-[12.5px] text-[#7a5b1f]">
      <span>
        Viewing as <strong>{target?.name ?? target?.email}</strong> (
        {target?.role}) — signed in as {admin?.name ?? admin?.email}.
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={logout.isPending}
        className="ml-auto rounded-[7px] border border-[#d9bd74] bg-white px-2.5 py-1 font-semibold hover:bg-[#faeec9]"
      >
        {logout.isPending ? "Exiting…" : "Exit impersonation"}
      </button>
    </div>
  );
}
