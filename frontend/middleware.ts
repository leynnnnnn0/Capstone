import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/staff/login",
  "/register",
  "/forgot-password",
  "/products",
  "/ar",
  "/get-quote",
  "/track",
];

const CUSTOMER_ROUTES = ["/account"];
const STAFF_ROUTES = ["/dashboard", "/users"];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_ROUTES.some((route) => route !== "/" && matchesRoute(pathname, route));

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && role === "customer" && STAFF_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  if (token && role && role !== "customer" && CUSTOMER_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
