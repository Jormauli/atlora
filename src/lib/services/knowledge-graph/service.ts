import { prisma } from "@/lib/db/prisma";
import { findCanonicalMatch, uniqueCleanList } from "./canonicalize";
import type { ConceptRelationCandidate, KnowledgeConceptCandidate } from "./types";

export async function persistCardKnowledgeGraph(input: {
  userId: string;
  cardId: string;
  tags: string[];
  concepts: KnowledgeConceptCandidate[];
  relations: ConceptRelationCandidate[];
}) {
  const tagMap = await upsertTags(input.userId, input.tags);
  const conceptMap = await upsertConcepts(input.userId, input.concepts);

  for (const tag of Array.from(tagMap.values())) {
    await prisma.cardTag.upsert({
      where: { cardId_tagId: { cardId: input.cardId, tagId: tag.id } },
      update: { source: "ai" },
      create: { cardId: input.cardId, tagId: tag.id, source: "ai" }
    });
  }

  for (const candidate of input.concepts) {
    const concept = conceptMap.get(candidate.name);
    if (!concept) continue;
    await prisma.cardConcept.upsert({
      where: { cardId_conceptId: { cardId: input.cardId, conceptId: concept.id } },
      update: {
        relevance: candidate.relevance ?? "medium",
        evidence: candidate.evidence ?? null,
        source: "ai"
      },
      create: {
        cardId: input.cardId,
        conceptId: concept.id,
        relevance: candidate.relevance ?? "medium",
        evidence: candidate.evidence ?? null,
        source: "ai"
      }
    });
  }

  for (const relation of input.relations) {
    const source = conceptMap.get(relation.source);
    const target = conceptMap.get(relation.target);
    if (!source || !target || source.id === target.id) continue;
    const edge = await prisma.conceptRelation.upsert({
      where: {
        userId_sourceConceptId_relationType_targetConceptId: {
          userId: input.userId,
          sourceConceptId: source.id,
          relationType: relation.relation_type,
          targetConceptId: target.id
        }
      },
      update: {
        confidence: clampConfidence(relation.confidence),
        status: "active"
      },
      create: {
        userId: input.userId,
        sourceConceptId: source.id,
        relationType: relation.relation_type,
        targetConceptId: target.id,
        confidence: clampConfidence(relation.confidence),
        status: "active"
      }
    });
    await prisma.conceptRelationEvidence.upsert({
      where: { relationId_cardId: { relationId: edge.id, cardId: input.cardId } },
      update: { evidence: relation.evidence ?? null, source: "ai" },
      create: { relationId: edge.id, cardId: input.cardId, evidence: relation.evidence ?? null, source: "ai" }
    });
  }
}

export class ManualConceptError extends Error {
  constructor(public code: "CARD_NOT_FOUND" | "INVALID_CONCEPT_NAME", message = code) {
    super(message);
  }
}

export async function addManualCardConcept(input: { userId: string; cardId: string; name: string }) {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) throw new ManualConceptError("INVALID_CONCEPT_NAME");

  await assertWritableCard(input.userId, input.cardId);
  const conceptMap = await upsertConcepts(input.userId, [{ name, relevance: "medium" }]);
  const concept = conceptMap.get(name);
  if (!concept) throw new ManualConceptError("INVALID_CONCEPT_NAME");

  await prisma.cardConcept.upsert({
    where: { cardId_conceptId: { cardId: input.cardId, conceptId: concept.id } },
    update: { relevance: "medium", evidence: null, source: "user" },
    create: { cardId: input.cardId, conceptId: concept.id, relevance: "medium", evidence: null, source: "user" }
  });

  return listCardKnowledgeConcepts(input.userId, input.cardId);
}

export async function removeManualCardConcept(input: { userId: string; cardId: string; conceptId: string }) {
  await assertWritableCard(input.userId, input.cardId);

  await prisma.cardConcept.deleteMany({
    where: {
      cardId: input.cardId,
      conceptId: input.conceptId,
      card: { userId: input.userId, status: { not: "deleted" } },
      concept: { userId: input.userId }
    }
  });

  return listCardKnowledgeConcepts(input.userId, input.cardId);
}

export async function listCardKnowledgeConcepts(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId, status: { not: "deleted" } },
    include: {
      cardConcepts: {
        include: { concept: true },
        orderBy: { concept: { canonicalName: "asc" } }
      }
    }
  });
  if (!card) throw new ManualConceptError("CARD_NOT_FOUND");

  return card.cardConcepts.map((item) => ({
    id: item.concept.id,
    name: item.concept.canonicalName,
    description: item.concept.description,
    relevance: item.relevance,
    evidence: item.evidence
  }));
}

async function upsertTags(userId: string, names: string[]) {
  const existing = await prisma.tag.findMany({ where: { userId } });
  const matchInput = existing.map((tag) => ({
    id: tag.id,
    name: tag.name,
    aliases: jsonStringArray(tag.aliases)
  }));
  const result = new Map<string, { id: string; name: string }>();
  for (const name of uniqueCleanList(names)) {
    const match = findCanonicalMatch(name, matchInput);
    const tag = match
      ? existing.find((item) => item.id === match.id)!
      : await prisma.tag.create({ data: { userId, name, aliases: [] } });
    result.set(name, { id: tag.id, name: tag.name });
  }
  return result;
}

async function upsertConcepts(userId: string, candidates: KnowledgeConceptCandidate[]) {
  const existing = await prisma.knowledgeConcept.findMany({
    where: { userId, status: "active" }
  });
  const matchInput = existing.map((concept) => ({
    id: concept.id,
    name: concept.canonicalName,
    aliases: jsonStringArray(concept.aliases)
  }));
  const result = new Map<string, { id: string; canonicalName: string }>();

  for (const candidate of candidates) {
    const names = uniqueCleanList([candidate.name, ...(candidate.aliases ?? [])]);
    if (!names.length) continue;
    const match = names.map((name) => findCanonicalMatch(name, matchInput)).find(Boolean);
    const concept = match
      ? existing.find((item) => item.id === match.id)!
      : await prisma.knowledgeConcept.create({
          data: {
            userId,
            canonicalName: candidate.name,
            aliases: uniqueCleanList(candidate.aliases ?? []),
            description: candidate.description ?? null
          }
        });
    if (!match) {
      existing.push(concept);
      matchInput.push({
        id: concept.id,
        name: concept.canonicalName,
        aliases: jsonStringArray(concept.aliases)
      });
    }
    for (const name of names) result.set(name, { id: concept.id, canonicalName: concept.canonicalName });
  }
  return result;
}

function clampConfidence(value: number | undefined) {
  return Math.max(0, Math.min(1, value ?? 0.7));
}

async function assertWritableCard(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId, status: { not: "deleted" } },
    select: { id: true }
  });
  if (!card) throw new ManualConceptError("CARD_NOT_FOUND");
}

function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : [];
}
