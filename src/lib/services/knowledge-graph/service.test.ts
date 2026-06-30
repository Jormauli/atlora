import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { persistCardKnowledgeGraph } from "./service";

test("persistCardKnowledgeGraph reuses tags concepts and relation edges", async () => {
  const user = await prisma.user.create({
    data: { email: `graph-${Date.now()}@example.test`, passwordHash: "test" }
  });
  const firstCard = await prisma.card.create({
    data: baseCardData(user.id, "RAG 入门")
  });
  const secondCard = await prisma.card.create({
    data: baseCardData(user.id, "RAG 进阶")
  });

  try {
    await persistCardKnowledgeGraph({
      userId: user.id,
      cardId: firstCard.id,
      tags: ["AI 工具", "RAG"],
      concepts: [
        { name: "RAG", aliases: ["Retrieval-Augmented Generation"], relevance: "high", evidence: "第一张卡解释 RAG" },
        { name: "Hallucination", aliases: ["幻觉"], relevance: "medium", evidence: "第一张卡提到幻觉" }
      ],
      relations: [
        { source: "RAG", relation_type: "solves", target: "Hallucination", evidence: "RAG 降低幻觉", confidence: 0.8 }
      ]
    });

    await persistCardKnowledgeGraph({
      userId: user.id,
      cardId: secondCard.id,
      tags: ["AI工具"],
      concepts: [
        { name: "Retrieval-Augmented Generation", relevance: "high", evidence: "第二张卡继续解释 RAG" },
        { name: "幻觉", relevance: "medium", evidence: "第二张卡提到幻觉" }
      ],
      relations: [
        { source: "Retrieval-Augmented Generation", relation_type: "solves", target: "幻觉", evidence: "第二张卡也支持这条边", confidence: 0.7 }
      ]
    });

    const concepts = await prisma.knowledgeConcept.findMany({ where: { userId: user.id } });
    const relations = await prisma.conceptRelation.findMany({
      where: { userId: user.id },
      include: { evidence: true }
    });
    const cardConcepts = await prisma.cardConcept.findMany({ where: { cardId: secondCard.id } });

    assert.equal(concepts.length, 2);
    assert.equal(relations.length, 1);
    assert.equal(relations[0].relationType, "solves");
    assert.equal(relations[0].evidence.length, 2);
    assert.equal(cardConcepts.length, 2);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

function baseCardData(userId: string, title: string) {
  return {
    userId,
    title,
    summary: "测试卡片",
    keyPoints: ["观点：测试"],
    actionItems: [],
    tags: [],
    category: "测试",
    cardType: "general_summary",
    perspective: "general",
    sourceType: "text" as const,
    aiTemplateId: "content_view"
  };
}
