import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { addManualCardConcept, removeManualCardConcept } from "./service";

test("addManualCardConcept creates a user concept and card link with source user", async () => {
  const user = await prisma.user.create({ data: { email: `manual-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Manual RAG") });

  try {
    const concepts = await addManualCardConcept({ userId: user.id, cardId: card.id, name: "  RAG  " });
    const stored = await prisma.knowledgeConcept.findMany({ where: { userId: user.id } });
    const link = await prisma.cardConcept.findUnique({
      where: { cardId_conceptId: { cardId: card.id, conceptId: concepts[0].id } }
    });

    assert.equal(concepts.length, 1);
    assert.equal(concepts[0].name, "RAG");
    assert.equal(stored.length, 1);
    assert.equal(stored[0].canonicalName, "RAG");
    assert.equal(link?.source, "user");
    assert.equal(link?.relevance, "medium");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("addManualCardConcept reuses canonical concept names and aliases", async () => {
  const user = await prisma.user.create({ data: { email: `manual-alias-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Alias RAG") });
  const existing = await prisma.knowledgeConcept.create({
    data: { userId: user.id, canonicalName: "RAG", aliases: ["Retrieval-Augmented Generation"] }
  });

  try {
    const concepts = await addManualCardConcept({
      userId: user.id,
      cardId: card.id,
      name: " retrieval-augmented generation "
    });
    const allConcepts = await prisma.knowledgeConcept.findMany({ where: { userId: user.id } });

    assert.equal(concepts.length, 1);
    assert.equal(concepts[0].id, existing.id);
    assert.equal(concepts[0].name, "RAG");
    assert.equal(allConcepts.length, 1);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("removeManualCardConcept deletes only the card concept link", async () => {
  const user = await prisma.user.create({ data: { email: `manual-remove-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(user.id, "Remove RAG") });

  try {
    const added = await addManualCardConcept({ userId: user.id, cardId: card.id, name: "RAG" });
    const concepts = await removeManualCardConcept({ userId: user.id, cardId: card.id, conceptId: added[0].id });
    const remainingConcept = await prisma.knowledgeConcept.findUnique({ where: { id: added[0].id } });
    const remainingLink = await prisma.cardConcept.findUnique({
      where: { cardId_conceptId: { cardId: card.id, conceptId: added[0].id } }
    });

    assert.equal(concepts.length, 0);
    assert.ok(remainingConcept);
    assert.equal(remainingLink, null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
});

test("manual concept helpers reject other users and deleted cards", async () => {
  const owner = await prisma.user.create({ data: { email: `manual-owner-${Date.now()}@example.test`, passwordHash: "test" } });
  const other = await prisma.user.create({ data: { email: `manual-other-${Date.now()}@example.test`, passwordHash: "test" } });
  const card = await prisma.card.create({ data: baseCardData(owner.id, "Private Card") });
  const deleted = await prisma.card.create({ data: { ...baseCardData(owner.id, "Deleted Card"), status: "deleted" } });

  try {
    await assert.rejects(
      () => addManualCardConcept({ userId: other.id, cardId: card.id, name: "RAG" }),
      /CARD_NOT_FOUND/
    );
    await assert.rejects(
      () => addManualCardConcept({ userId: owner.id, cardId: deleted.id, name: "RAG" }),
      /CARD_NOT_FOUND/
    );
  } finally {
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: other.id } }).catch(() => {});
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
