import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { captureServerEvent } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { cardPatchSchema } from "@/lib/validators/card";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: user.id, status: { not: "deleted" } } });
  if (!card) return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json({ card });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = cardPatchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  const data = {
    ...parsed.data,
    localizedContent: parsed.data.localizedContent === null ? Prisma.JsonNull : parsed.data.localizedContent
  };
  const card = await prisma.card.updateMany({
    where: { id: params.id, userId: user.id, status: { not: "deleted" } },
    data
  });
  if (!card.count) return NextResponse.json({ error: "未找到" }, { status: 404 });
  await captureServerEvent({ userId: user.id, event: "card_saved" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  await prisma.card.updateMany({
    where: { id: params.id, userId: user.id },
    data: { status: "deleted" }
  });
  return NextResponse.json({ ok: true });
}
