import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { persistCardKnowledgeGraph } from "@/lib/services/knowledge-graph/service";
import { recordUsage } from "@/lib/services/usage/service";
import type { ConceptRelationCandidate, KnowledgeConceptCandidate } from "@/lib/services/knowledge-graph/types";

export async function createDraftCard(input: {
  userId: string;
  generated: {
    title: string;
    summary: string;
    key_points: string[];
    action_items: string[];
    framework_structure?: string[];
    critical_evidence?: string[];
    reusable_insights?: string[];
    used_models?: string[];
    connections?: string[];
    role_perspectives?: string[];
    localized_content?: Record<string, unknown> | null;
    tags: string[];
    category: string;
    card_type: string;
    perspective: string;
    source_title?: string | null;
    source_domain?: string | null;
    knowledge_concepts?: KnowledgeConceptCandidate[];
    concept_relations?: ConceptRelationCandidate[];
  };
  sourceType: "text" | "image" | "link";
  ingestionItemId?: string | null;
  sourceUrl?: string | null;
  templateId: string;
}) {
  const localizedContent = input.generated.localized_content
    ? input.generated.localized_content as Prisma.InputJsonValue
    : undefined;
  const card = await prisma.card.create({
    data: {
      userId: input.userId,
      ingestionItemId: input.ingestionItemId,
      title: input.generated.title,
      summary: input.generated.summary,
      keyPoints: input.generated.key_points,
      actionItems: input.generated.action_items,
      frameworkStructure: input.generated.framework_structure ?? [],
      criticalEvidence: input.generated.critical_evidence ?? [],
      reusableInsights: input.generated.reusable_insights ?? [],
      usedModels: input.generated.used_models ?? [],
      connections: input.generated.connections ?? [],
      rolePerspectives: input.generated.role_perspectives ?? [],
      localizedContent,
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
  await persistCardKnowledgeGraph({
    userId: input.userId,
    cardId: card.id,
    tags: input.generated.tags,
    concepts: input.generated.knowledge_concepts ?? [],
    relations: input.generated.concept_relations ?? []
  });
  await recordUsage({
    userId: input.userId,
    usageType: "card_generate",
    taskType: "card_generation",
    relatedId: card.id
  });
  return card;
}
