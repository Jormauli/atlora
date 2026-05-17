import { prisma } from "@/lib/db/prisma";
import { recordUsage } from "@/lib/services/usage/service";

export async function createDraftCard(input: {
  userId: string;
  generated: {
    title: string;
    summary: string;
    key_points: string[];
    action_items: string[];
    tags: string[];
    category: string;
    card_type: string;
    perspective: string;
    source_title?: string | null;
    source_domain?: string | null;
  };
  sourceType: "text" | "image" | "link";
  sourceUrl?: string | null;
  templateId: string;
}) {
  const card = await prisma.card.create({
    data: {
      userId: input.userId,
      title: input.generated.title,
      summary: input.generated.summary,
      keyPoints: input.generated.key_points,
      actionItems: input.generated.action_items,
      tags: input.generated.tags,
      category: input.generated.category,
      cardType: input.generated.card_type,
      perspective: input.generated.perspective,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      sourceTitle: input.generated.source_title,
      sourceDomain: input.generated.source_domain,
      aiTemplateId: input.templateId
    }
  });
  await recordUsage({
    userId: input.userId,
    usageType: "card_generate",
    taskType: "card_generation",
    relatedId: card.id
  });
  return card;
}
