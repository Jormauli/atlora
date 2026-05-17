import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { profileSchema } from "@/lib/validators/profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  return NextResponse.json({ profile: user.profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      primaryUseCase: parsed.data.primaryUseCases.join(" | "),
      defaultPerspective: parsed.data.defaultPerspective
    },
    create: {
      userId: user.id,
      primaryUseCase: parsed.data.primaryUseCases.join(" | "),
      defaultPerspective: parsed.data.defaultPerspective
    }
  });
  return NextResponse.json({ profile });
}
