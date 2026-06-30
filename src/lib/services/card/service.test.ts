import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { createDraftCard } from "./service";

test("createDraftCard persists canonical tags concepts and relations", async () => {
  const user = await prisma.user.create({
    data: { email: `card-graph-${Date.now()}@example.test`, passwordHash: "test" }
  });

  try {
    const card = await createDraftCard({
      userId: user.id,
      generated: {
        title: "RAG",
        summary: "RAG 降低幻觉。",
        key_points: ["观点：RAG 降低幻觉"],
        action_items: [],
        tags: ["AI 工具"],
        category: "工具/技能",
        card_type: "tool_skill",
        perspective: "tool_skill",
        knowledge_concepts: [
          { name: "RAG", relevance: "high", evidence: "卡片解释 RAG" },
          { name: "Hallucination", relevance: "medium", evidence: "卡片提到幻觉" }
        ],
        concept_relations: [
          { source: "RAG", relation_type: "solves", target: "Hallucination", evidence: "RAG 用检索降低幻觉" }
        ]
      },
      sourceType: "text",
      templateId: "content_view"
    });

    const saved = await prisma.card.findUnique({
      where: { id: card.id },
      include: { cardTags: true, cardConcepts: true, conceptRelationEvidence: true }
    });

    assert.equal(saved?.cardTags.length, 1);
    assert.equal(saved?.cardConcepts.length, 2);
    assert.equal(saved?.conceptRelationEvidence.length, 1);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});
