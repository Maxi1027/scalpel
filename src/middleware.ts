import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.REVIEW_AUTH_SECRET || "scalpel-review-secret-change-me",
);

const COOKIE_NAME = "scalpel-review-session";
const ALLOWED = ["maxiqin1027@gmail.com"];

export async function middleware(request: NextRequest) {
  // Only protect /review routes (except login page and API)
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/review")) return NextResponse.next();
  if (
    pathname === "/review/login" ||
    pathname.startsWith("/review/_") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/review/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const email = payload.email as string;
    if (!ALLOWED.includes(email)) {
      return NextResponse.redirect(new URL("/review/login", request.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL("/review/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/review/:path*"],
};
