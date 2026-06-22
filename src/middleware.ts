import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isIndexablePath, localeFromPath, type SeoLocale } from "@/lib/seo";

const protectedRoutes = ["/dashboard", "/new", "/cards", "/settings", "/usage", "/onboarding"];
const cookieName = "ai_material_box_session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !(await hasVerifiedSession(request))) {
    return applyIndexPolicy(NextResponse.redirect(new URL("/login", request.url)), pathname);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-atlora-locale", getRequestLocale(request));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applyIndexPolicy(response, pathname);
}

function getRequestLocale(request: NextRequest): SeoLocale {
  const routeLocale = localeFromPath(request.nextUrl.pathname);
  if (routeLocale) return routeLocale;
  return request.cookies.get("atlora-ui-language")?.value === "en" ? "en" : "zh";
}

function applyIndexPolicy(response: NextResponse, pathname: string) {
  if (!isIndexablePath(pathname)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

async function hasVerifiedSession(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.sub === "string" && payload.sub.length > 0;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
