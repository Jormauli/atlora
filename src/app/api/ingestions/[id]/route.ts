import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const ingestion = await prisma.ingestionItem.findFirst({
    where: { id: params.id, userId: user.id },
    include: { card: { select: { id: true } } }
  });
  if (!ingestion) return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json({
    ingestion: {
      id: ingestion.id,
      status: ingestion.status,
      stage: ingestion.stage,
      failureCode: ingestion.failureCode,
      errorMessage: ingestion.errorMessage,
      createdAt: ingestion.createdAt,
      processingStartedAt: ingestion.processingStartedAt,
      processingCompletedAt: ingestion.processingCompletedAt,
      rawUrl: ingestion.rawUrl,
      cardId: ingestion.card?.id ?? null
    }
  });
}
