import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) return null;
  return new TextEncoder().encode(value);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/api/files") ||
    pathname.startsWith("/api/upload");

  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const key = secret();
  if (!key) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/admin/:path*", "/student/:path*", "/api/files/:path*", "/api/upload/:path*"],
};
