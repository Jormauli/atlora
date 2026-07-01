import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/events";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "邮箱已注册" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      passwordHash: await bcrypt.hash(parsed.data.password, 10)
    }
  });
  await createSession(user.id);
  await captureServerEvent({ userId: user.id, event: "user_registered" });
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
