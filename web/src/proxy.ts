import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_HOSTNAME = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME ?? "superadmin.mytuto.org";

/**
 * Pure hostname/path routing — this can't see who's logged in (auth is
 * localStorage-based, invisible to server-side Proxy), so role-based
 * gating lives client-side in lib/auth.ts#isAllowedOnHost instead. This
 * just keeps the admin subdomain from ever rendering unrelated pages
 * (marketing sections, /find-a-tutor, /teachers/[id]).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Read the raw Host header rather than request.nextUrl.hostname — this
  // app runs behind a plain custom `server.js` (not Next's own server),
  // where nextUrl's hostname resolution isn't reliably sourced from the
  // incoming Host header.
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  if (hostname === ADMIN_HOSTNAME) {
    const isAllowedPath = pathname === "/" || pathname === "/login" || pathname.startsWith("/dashboard");

    if (!isAllowedPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|logo-wordmark.png).*)",
  ],
};
