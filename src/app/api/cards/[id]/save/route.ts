import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const result = await prisma.card.updateMany({
    where: { id: params.id, userId: user.id, status: "draft" },
    data: { status: "saved" }
  });
  if (!result.count) return NextResponse.json({ error: "未找到草稿" }, { status: 404 });
  await captureServerEvent({ userId: user.id, event: "card_saved" });
  return NextResponse.json({ ok: true });
}
