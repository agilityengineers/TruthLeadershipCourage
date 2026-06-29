import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight gate: redirect unauthenticated users away from app areas.
 * Fine-grained role checks happen in each area's layout via requireRole().
 * We only check for the session cookie here (Edge-safe; no DB/bcrypt).
 */
const PROTECTED = ["/portal", "/trainer", "/admin", "/company"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/trainer/:path*", "/admin/:path*", "/company/:path*"],
};
