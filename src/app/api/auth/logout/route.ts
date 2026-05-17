import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  clearSession();
  return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"), { status: 303 });
}
