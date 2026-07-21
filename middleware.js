import { NextResponse } from "next/server";
import { isValidSessionToken, ADMIN_COOKIE_NAME } from "./lib/auth";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Let the login page itself and the login API through.
  if (pathname === "/admin/login" || pathname === "/api/admin-login") {
    return NextResponse.next();
  }

  const needsAuth =
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/api/products") && request.method !== "GET") ||
    (pathname.startsWith("/api/blocked-dates") && request.method !== "GET");

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!isValidSessionToken(token)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/products/:path*", "/api/blocked-dates/:path*"],
};
