import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      status: "saved",
      cardType: searchParams.get("type") ?? undefined,
      OR: searchParams.get("q")
        ? [
            { title: { contains: searchParams.get("q")!, mode: "insensitive" } },
            { summary: { contains: searchParams.get("q")!, mode: "insensitive" } }
          ]
        : undefined
    },
    orderBy: { createdAt: searchParams.get("sort") === "asc" ? "asc" : "desc" }
  });
  return NextResponse.json({ cards });
}
