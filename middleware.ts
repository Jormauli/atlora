import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/new", "/cards", "/settings", "/usage", "/onboarding"];

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("ai_material_box_session");
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/new/:path*", "/cards/:path*", "/settings/:path*", "/usage/:path*", "/onboarding/:path*"]
};
