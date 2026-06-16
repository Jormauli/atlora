import { redirect } from "next/navigation";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Card } from "@prisma/client";
import type { DashboardCard } from "@/lib/dashboard/card-view-model";

export default async function DashboardPage({ searchParams }: { searchParams: { q?: string; type?: string; sort?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/onboarding");
  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      status: "saved",
      cardType: searchParams.type || undefined,
      OR: searchParams.q
        ? [{ title: { contains: searchParams.q, mode: "insensitive" } }, { summary: { contains: searchParams.q, mode: "insensitive" } }]
        : undefined
    },
    orderBy: { createdAt: searchParams.sort === "asc" ? "asc" : "desc" }
  });
  return <DashboardWorkspace cards={cards.map(serializeDashboardCard)} />;
}

function serializeDashboardCard(card: Card): DashboardCard {
  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    keyPoints: card.keyPoints as string[],
    rolePerspectives: (card.rolePerspectives as string[] | null) ?? [],
    localizedContent: card.localizedContent as DashboardCard["localizedContent"],
    tags: card.tags as string[],
    category: card.category,
    cardType: card.cardType,
    perspective: card.perspective,
    sourceType: card.sourceType,
    sourceUrl: card.sourceUrl,
    sourceTitle: card.sourceTitle,
    sourceDomain: card.sourceDomain,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
}
