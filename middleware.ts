import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes = ["/dashboard", "/new", "/cards", "/settings", "/usage", "/onboarding"];
const cookieName = "ai_material_box_session";

export async function middleware(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  if (isProtected && !(await hasVerifiedSession(request))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
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
  matcher: ["/dashboard/:path*", "/new/:path*", "/cards/:path*", "/settings/:path*", "/usage/:path*", "/onboarding/:path*"]
};
