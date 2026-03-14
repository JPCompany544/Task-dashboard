import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("ec_role")?.value;
  const { pathname } = request.nextUrl;

  // ── Already authenticated → skip login pages ──────────────────────────────
  if (pathname === "/login" && role === "employee") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/admin/login" && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // ── Root redirect ──────────────────────────────────────────────────────────
  if (pathname === "/") {
    if (role === "employee") return NextResponse.redirect(new URL("/dashboard", request.url));
    if (role === "admin")    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Protect employee dashboard ─────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (role !== "employee") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Protect admin dashboard (but NOT /admin/login) ────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/admin/:path*"],
};
