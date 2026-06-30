import { redirect } from "next/navigation";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Card } from "@prisma/client";
import type { DashboardCard } from "@/lib/dashboard/card-view-model";

type DashboardCardRecord = Card & {
  cardConcepts: Array<{
    relevance: "high" | "medium" | "low";
    evidence: string | null;
    concept: {
      id: string;
      canonicalName: string;
      description: string | null;
      cards: Array<{ card: { id: string; title: string; status: string; userId: string } }>;
    };
  }>;
  conceptRelationEvidence: Array<{
    relation: {
      relationType: string;
      sourceConcept: { canonicalName: string };
      targetConcept: { canonicalName: string };
      evidence: Array<{ card: { id: string; title: string; status: string; userId: string } }>;
    };
  }>;
};

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
    orderBy: { createdAt: searchParams.sort === "asc" ? "asc" : "desc" },
    include: {
      cardConcepts: {
        include: {
          concept: {
            include: {
              cards: {
                include: {
                  card: {
                    select: { id: true, title: true, status: true, userId: true }
                  }
                }
              }
            }
          }
        }
      },
      conceptRelationEvidence: {
        include: {
          relation: {
            include: {
              sourceConcept: true,
              targetConcept: true,
              evidence: {
                include: {
                  card: {
                    select: { id: true, title: true, status: true, userId: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return <DashboardWorkspace cards={cards.map(serializeDashboardCard)} />;
}

function serializeDashboardCard(card: DashboardCardRecord): DashboardCard {
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
    knowledgeConcepts: card.cardConcepts.map((item) => ({
      id: item.concept.id,
      name: item.concept.canonicalName,
      description: item.concept.description,
      relevance: item.relevance,
      evidence: item.evidence
    })),
    relatedCards: buildRelatedCards(card),
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
}

function buildRelatedCards(card: DashboardCardRecord) {
  const related = new Map<string, DashboardCard["relatedCards"][number]>();
  for (const cardConcept of card.cardConcepts) {
    for (const item of cardConcept.concept.cards) {
      if (item.card.id === card.id || item.card.status !== "saved" || item.card.userId !== card.userId) continue;
      related.set(item.card.id, {
        id: item.card.id,
        title: item.card.title,
        reason: `Shares ${cardConcept.concept.canonicalName}`,
        relationType: "shared_concept",
        conceptName: cardConcept.concept.canonicalName
      });
    }
  }
  for (const evidence of card.conceptRelationEvidence) {
    for (const item of evidence.relation.evidence) {
      if (item.card.id === card.id || item.card.status !== "saved" || item.card.userId !== card.userId) continue;
      related.set(item.card.id, {
        id: item.card.id,
        title: item.card.title,
        reason: `${evidence.relation.sourceConcept.canonicalName} ${evidence.relation.relationType} ${evidence.relation.targetConcept.canonicalName}`,
        relationType: evidence.relation.relationType as DashboardCard["relatedCards"][number]["relationType"],
        conceptName: evidence.relation.sourceConcept.canonicalName,
        targetConceptName: evidence.relation.targetConcept.canonicalName
      });
    }
  }
  return Array.from(related.values()).slice(0, 5);
}
