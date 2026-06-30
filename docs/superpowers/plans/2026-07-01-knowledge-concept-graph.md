# Knowledge Concept Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first private knowledge concept graph for Atlora cards, with canonical tags, canonical concepts, concept relationships, and related-card explanations in the card detail modal.

**Architecture:** Keep `Card` as the source summary record, but add normalized tag/concept/relation tables around it. New card generation will validate AI concept candidates, canonicalize them against existing user entities, upsert graph nodes and edges, then dashboard queries will serialize concepts and related-card reasons for display. The first version is user-private, new-card-only, and card-detail-driven; it does not include a full graph UI or historical backfill.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma/PostgreSQL, Zod, Node test runner via `tsx --test`, Tailwind CSS, existing Atlora LLM provider abstraction.

---

## File Structure

- Modify `prisma/schema.prisma`: add enums and graph tables.
- Create `prisma/migrations/202607010001_add_knowledge_concept_graph/migration.sql`: SQL migration matching the Prisma schema.
- Modify `src/lib/validators/card.ts`: validate AI-provided `knowledge_concepts` and `concept_relations`.
- Modify `src/lib/validators/card.test.ts`: schema tests for concepts and relations.
- Create `src/lib/services/knowledge-graph/types.ts`: shared relation type, candidate, and serialized UI types.
- Create `src/lib/services/knowledge-graph/canonicalize.ts`: deterministic name normalization and exact alias matching helpers.
- Create `src/lib/services/knowledge-graph/canonicalize.test.ts`: pure unit tests for canonicalization helpers.
- Create `src/lib/services/knowledge-graph/service.ts`: database orchestration for tags, concepts, card links, relations, and evidence.
- Create `src/lib/services/knowledge-graph/service.test.ts`: integration tests for reuse, upsert, and evidence accumulation.
- Modify `src/lib/services/card/service.ts`: call knowledge graph persistence after card creation.
- Modify `src/lib/services/ai-orchestration/service.ts`: pass bounded existing graph context to provider prompts.
- Modify `src/lib/providers/llm/types.ts`: add optional `graphContext`.
- Modify `src/lib/providers/llm/mock.ts`: include concept fields in mock card output.
- Modify `src/lib/prompts/content_view.zh.md`, `src/lib/prompts/general_summary.zh.md`, `src/lib/prompts/content_creator.zh.md`, `src/lib/prompts/startup_product.zh.md`, `src/lib/prompts/investment_info.zh.md`, `src/lib/prompts/tool_app.zh.md`, and `src/lib/prompts/learning_note.zh.md`: request bounded concepts and relation candidates.
- Modify `src/lib/prompts/prompt-contract.test.ts`: lock the prompt contract.
- Modify `src/app/dashboard/page.tsx`: include concepts and relation-backed related cards in dashboard query and serializer.
- Modify `src/lib/dashboard/card-view-model.ts`: add `knowledgeConcepts` and `relatedCards` to `DashboardCard`, include concept names in search.
- Modify `src/lib/dashboard/card-view-model.test.ts`: prove concept search and legacy compatibility.
- Modify `src/components/dashboard/card-detail-modal.tsx`: show concepts and related cards.
- Modify `src/components/dashboard/card-detail-modal.test.ts`: static contract tests for the new modal sections.
- Modify `src/lib/language.ts`: add bilingual UI labels for concepts and related cards.

## Task 1: Database Schema And Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202607010001_add_knowledge_concept_graph/migration.sql`

- [ ] **Step 1: Add Prisma enums and models**

Add these enums after `CardVisibility`:

```prisma
enum GraphEntitySource {
  ai
  user
  system
}

enum KnowledgeConceptStatus {
  active
  merged
  hidden
}

enum ConceptRelationStatus {
  active
  rejected
  merged
}

enum ConceptRelevance {
  high
  medium
  low
}
```

Add relations to `User`:

```prisma
  tags                 Tag[]
  knowledgeConcepts    KnowledgeConcept[]
  conceptRelations     ConceptRelation[]
```

Add relations to `Card`:

```prisma
  cardTags                  CardTag[]
  cardConcepts              CardConcept[]
  conceptRelationEvidence   ConceptRelationEvidence[]
```

Add these models after `Card`:

```prisma
model Tag {
  id        String              @id @default(cuid())
  userId    String
  name      String
  aliases   Json                @default("[]")
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt
  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  cards     CardTag[]

  @@unique([userId, name])
  @@index([userId, updatedAt])
}

model CardTag {
  cardId String
  tagId  String
  source GraphEntitySource @default(ai)
  card   Card              @relation(fields: [cardId], references: [id], onDelete: Cascade)
  tag    Tag               @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([cardId, tagId])
  @@index([tagId])
}

model KnowledgeConcept {
  id                    String                    @id @default(cuid())
  userId                String
  canonicalName         String
  aliases               Json                      @default("[]")
  description           String?
  status                KnowledgeConceptStatus    @default(active)
  mergedIntoId          String?
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  user                  User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  mergedInto            KnowledgeConcept?         @relation("ConceptMerge", fields: [mergedIntoId], references: [id], onDelete: SetNull)
  mergedConcepts        KnowledgeConcept[]        @relation("ConceptMerge")
  cards                 CardConcept[]
  outgoingRelations     ConceptRelation[]         @relation("SourceConcept")
  incomingRelations     ConceptRelation[]         @relation("TargetConcept")

  @@unique([userId, canonicalName])
  @@index([userId, status, updatedAt])
}

model CardConcept {
  cardId    String
  conceptId String
  relevance ConceptRelevance  @default(medium)
  evidence  String?
  source    GraphEntitySource @default(ai)
  card      Card              @relation(fields: [cardId], references: [id], onDelete: Cascade)
  concept   KnowledgeConcept  @relation(fields: [conceptId], references: [id], onDelete: Cascade)

  @@id([cardId, conceptId])
  @@index([conceptId])
}

model ConceptRelation {
  id              String                    @id @default(cuid())
  userId          String
  sourceConceptId String
  relationType    String
  targetConceptId String
  confidence      Float                     @default(0.7)
  status          ConceptRelationStatus     @default(active)
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt
  user            User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceConcept   KnowledgeConcept          @relation("SourceConcept", fields: [sourceConceptId], references: [id], onDelete: Cascade)
  targetConcept   KnowledgeConcept          @relation("TargetConcept", fields: [targetConceptId], references: [id], onDelete: Cascade)
  evidence        ConceptRelationEvidence[]

  @@unique([userId, sourceConceptId, relationType, targetConceptId])
  @@index([userId, status, updatedAt])
  @@index([targetConceptId])
}

model ConceptRelationEvidence {
  relationId String
  cardId     String
  evidence   String?
  source     GraphEntitySource @default(ai)
  relation   ConceptRelation   @relation(fields: [relationId], references: [id], onDelete: Cascade)
  card       Card              @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@id([relationId, cardId])
  @@index([cardId])
}
```

- [ ] **Step 2: Create SQL migration**

Create `prisma/migrations/202607010001_add_knowledge_concept_graph/migration.sql`:

```sql
CREATE TYPE "GraphEntitySource" AS ENUM ('ai', 'user', 'system');
CREATE TYPE "KnowledgeConceptStatus" AS ENUM ('active', 'merged', 'hidden');
CREATE TYPE "ConceptRelationStatus" AS ENUM ('active', 'rejected', 'merged');
CREATE TYPE "ConceptRelevance" AS ENUM ('high', 'medium', 'low');

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "aliases" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CardTag" (
  "cardId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "source" "GraphEntitySource" NOT NULL DEFAULT 'ai',
  CONSTRAINT "CardTag_pkey" PRIMARY KEY ("cardId", "tagId")
);

CREATE TABLE "KnowledgeConcept" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "aliases" JSONB NOT NULL DEFAULT '[]',
  "description" TEXT,
  "status" "KnowledgeConceptStatus" NOT NULL DEFAULT 'active',
  "mergedIntoId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeConcept_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CardConcept" (
  "cardId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "relevance" "ConceptRelevance" NOT NULL DEFAULT 'medium',
  "evidence" TEXT,
  "source" "GraphEntitySource" NOT NULL DEFAULT 'ai',
  CONSTRAINT "CardConcept_pkey" PRIMARY KEY ("cardId", "conceptId")
);

CREATE TABLE "ConceptRelation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceConceptId" TEXT NOT NULL,
  "relationType" TEXT NOT NULL,
  "targetConceptId" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "status" "ConceptRelationStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConceptRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConceptRelationEvidence" (
  "relationId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "evidence" TEXT,
  "source" "GraphEntitySource" NOT NULL DEFAULT 'ai',
  CONSTRAINT "ConceptRelationEvidence_pkey" PRIMARY KEY ("relationId", "cardId")
);

CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
CREATE INDEX "Tag_userId_updatedAt_idx" ON "Tag"("userId", "updatedAt");
CREATE INDEX "CardTag_tagId_idx" ON "CardTag"("tagId");
CREATE UNIQUE INDEX "KnowledgeConcept_userId_canonicalName_key" ON "KnowledgeConcept"("userId", "canonicalName");
CREATE INDEX "KnowledgeConcept_userId_status_updatedAt_idx" ON "KnowledgeConcept"("userId", "status", "updatedAt");
CREATE INDEX "CardConcept_conceptId_idx" ON "CardConcept"("conceptId");
CREATE UNIQUE INDEX "ConceptRelation_userId_sourceConceptId_relationType_targetConceptId_key" ON "ConceptRelation"("userId", "sourceConceptId", "relationType", "targetConceptId");
CREATE INDEX "ConceptRelation_userId_status_updatedAt_idx" ON "ConceptRelation"("userId", "status", "updatedAt");
CREATE INDEX "ConceptRelation_targetConceptId_idx" ON "ConceptRelation"("targetConceptId");
CREATE INDEX "ConceptRelationEvidence_cardId_idx" ON "ConceptRelationEvidence"("cardId");

ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeConcept" ADD CONSTRAINT "KnowledgeConcept_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeConcept" ADD CONSTRAINT "KnowledgeConcept_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "KnowledgeConcept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CardConcept" ADD CONSTRAINT "CardConcept_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardConcept" ADD CONSTRAINT "CardConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "KnowledgeConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptRelation" ADD CONSTRAINT "ConceptRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptRelation" ADD CONSTRAINT "ConceptRelation_sourceConceptId_fkey" FOREIGN KEY ("sourceConceptId") REFERENCES "KnowledgeConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptRelation" ADD CONSTRAINT "ConceptRelation_targetConceptId_fkey" FOREIGN KEY ("targetConceptId") REFERENCES "KnowledgeConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptRelationEvidence" ADD CONSTRAINT "ConceptRelationEvidence_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "ConceptRelation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptRelationEvidence" ADD CONSTRAINT "ConceptRelationEvidence_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Regenerate Prisma client**

Run: `npx prisma generate`

Expected: command exits 0 and reports Prisma Client generated.

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/202607010001_add_knowledge_concept_graph/migration.sql
git commit -m "feat: add knowledge graph schema"
```

## Task 2: AI Card Schema For Concepts And Relations

**Files:**
- Create: `src/lib/services/knowledge-graph/types.ts`
- Modify: `src/lib/validators/card.ts`
- Modify: `src/lib/validators/card.test.ts`

- [ ] **Step 1: Write failing validator tests**

Append to `src/lib/validators/card.test.ts`:

```ts
test("aiCardSchema accepts knowledge concepts and concept relations", () => {
  const parsed = aiCardSchema.parse({
    title: "RAG 卡片",
    summary: "RAG 通过检索外部知识降低幻觉。",
    key_points: ["观点：RAG 降低幻觉｜论据：检索提供外部证据"],
    tags: ["AI 工具"],
    category: "工具/技能",
    card_type: "tool_skill",
    perspective: "tool_skill",
    knowledge_concepts: [
      {
        name: "RAG",
        aliases: ["Retrieval-Augmented Generation"],
        description: "结合检索与生成的知识增强方法",
        relevance: "high",
        evidence: "原文说明 RAG 使用外部检索降低幻觉"
      }
    ],
    concept_relations: [
      {
        source: "RAG",
        relation_type: "solves",
        target: "Hallucination",
        evidence: "原文指出 RAG 用外部证据降低错误回答",
        confidence: 0.82
      }
    ]
  });

  assert.equal(parsed.knowledge_concepts[0].name, "RAG");
  assert.deepEqual(parsed.knowledge_concepts[0].aliases, ["Retrieval-Augmented Generation"]);
  assert.equal(parsed.knowledge_concepts[0].relevance, "high");
  assert.equal(parsed.concept_relations[0].relation_type, "solves");
});

test("aiCardSchema rejects unsupported concept relation types", () => {
  assert.throws(
    () => aiCardSchema.parse({
      title: "坏关系",
      summary: "关系类型不在白名单。",
      key_points: ["观点：关系要受控"],
      tags: ["AI"],
      category: "摘要",
      card_type: "general_summary",
      perspective: "general",
      knowledge_concepts: [{ name: "RAG" }],
      concept_relations: [{ source: "RAG", relation_type: "invented_relation", target: "Agent" }]
    }),
    /Invalid enum value|invalid enum value/i
  );
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/validators/card.test.ts`

Expected: FAIL because `knowledge_concepts` and `concept_relations` are not in `aiCardSchema`.

- [ ] **Step 3: Add shared graph types**

Create `src/lib/services/knowledge-graph/types.ts`:

```ts
export const conceptRelationTypes = [
  "is_a",
  "part_of",
  "uses",
  "depends_on",
  "implemented_by",
  "based_on",
  "solves",
  "improves",
  "replaces",
  "similar_to",
  "alternative_to",
  "belongs_to",
  "created_by",
  "developed_by",
  "competes_with",
  "applies_to",
  "related_to"
] as const;

export type ConceptRelationType = typeof conceptRelationTypes[number];
export type ConceptRelevanceValue = "high" | "medium" | "low";

export interface KnowledgeConceptCandidate {
  id?: string;
  name: string;
  aliases?: string[];
  description?: string | null;
  relevance?: ConceptRelevanceValue;
  evidence?: string | null;
  reason?: string | null;
}

export interface ConceptRelationCandidate {
  source: string;
  relation_type: ConceptRelationType;
  target: string;
  evidence?: string | null;
  confidence?: number;
}

export interface SerializedKnowledgeConcept {
  id: string;
  name: string;
  description: string | null;
  relevance: ConceptRelevanceValue;
  evidence: string | null;
}

export interface SerializedRelatedCard {
  id: string;
  title: string;
  reason: string;
  relationType: ConceptRelationType | "shared_concept";
  conceptName: string;
  targetConceptName?: string;
}
```

- [ ] **Step 4: Extend validator schema**

Modify `src/lib/validators/card.ts`:

```ts
import { conceptRelationTypes } from "@/lib/services/knowledge-graph/types";
```

Add before `aiCardSchema`:

```ts
const aliasesSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}, z.array(z.string()).default([]));

const conceptRelevanceSchema = z.enum(["high", "medium", "low"]).default("medium");

const knowledgeConceptCandidateSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1).max(80),
  aliases: aliasesSchema,
  description: z.string().trim().max(240).nullable().optional(),
  relevance: conceptRelevanceSchema,
  evidence: z.string().trim().max(500).nullable().optional(),
  reason: z.string().trim().max(240).nullable().optional()
});

const conceptRelationCandidateSchema = z.object({
  source: z.string().trim().min(1).max(80),
  relation_type: z.enum(conceptRelationTypes),
  target: z.string().trim().min(1).max(80),
  evidence: z.string().trim().max(500).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.7)
});
```

Add these fields inside `aiCardSchema`:

```ts
  knowledge_concepts: z.array(knowledgeConceptCandidateSchema).default([]),
  concept_relations: z.array(conceptRelationCandidateSchema).default([]),
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- src/lib/validators/card.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/knowledge-graph/types.ts src/lib/validators/card.ts src/lib/validators/card.test.ts
git commit -m "feat: validate knowledge graph candidates"
```

## Task 3: Canonicalization Helpers

**Files:**
- Create: `src/lib/services/knowledge-graph/canonicalize.ts`
- Create: `src/lib/services/knowledge-graph/canonicalize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/services/knowledge-graph/canonicalize.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { findCanonicalMatch, normalizeEntityName } from "./canonicalize";

test("normalizeEntityName trims case and spacing differences", () => {
  assert.equal(normalizeEntityName("  AI   Agent "), "ai agent");
  assert.equal(normalizeEntityName("RAG"), "rag");
});

test("findCanonicalMatch matches canonical names and aliases", () => {
  const existing = [
    { id: "concept-1", name: "智能体", aliases: ["AI Agent", "Agent"] },
    { id: "concept-2", name: "RAG", aliases: ["Retrieval-Augmented Generation"] }
  ];

  assert.equal(findCanonicalMatch("ai agent", existing)?.id, "concept-1");
  assert.equal(findCanonicalMatch("Retrieval Augmented Generation", existing)?.id, undefined);
  assert.equal(findCanonicalMatch("Retrieval-Augmented Generation", existing)?.id, "concept-2");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/services/knowledge-graph/canonicalize.test.ts`

Expected: FAIL because `canonicalize.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Create `src/lib/services/knowledge-graph/canonicalize.ts`:

```ts
export interface CanonicalMatchInput {
  id: string;
  name: string;
  aliases?: string[];
}

export function normalizeEntityName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function uniqueCleanList(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    const key = normalizeEntityName(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

export function findCanonicalMatch(value: string, existing: CanonicalMatchInput[]) {
  const normalized = normalizeEntityName(value);
  return existing.find((item) => {
    if (normalizeEntityName(item.name) === normalized) return true;
    return (item.aliases ?? []).some((alias) => normalizeEntityName(alias) === normalized);
  });
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/services/knowledge-graph/canonicalize.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/knowledge-graph/canonicalize.ts src/lib/services/knowledge-graph/canonicalize.test.ts
git commit -m "feat: add graph canonicalization helpers"
```

## Task 4: Knowledge Graph Persistence Service

**Files:**
- Create: `src/lib/services/knowledge-graph/service.ts`
- Create: `src/lib/services/knowledge-graph/service.test.ts`

- [ ] **Step 1: Write integration tests**

Create `src/lib/services/knowledge-graph/service.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/services/knowledge-graph/service.test.ts`

Expected: FAIL because `persistCardKnowledgeGraph` does not exist.

- [ ] **Step 3: Implement persistence service**

Create `src/lib/services/knowledge-graph/service.ts`:

```ts
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

  for (const tag of tagMap.values()) {
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
        confidence: Math.max(0, Math.min(1, relation.confidence ?? 0.7)),
        status: "active"
      },
      create: {
        userId: input.userId,
        sourceConceptId: source.id,
        relationType: relation.relation_type,
        targetConceptId: target.id,
        confidence: Math.max(0, Math.min(1, relation.confidence ?? 0.7)),
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

async function upsertTags(userId: string, names: string[]) {
  const existing = await prisma.tag.findMany({ where: { userId } });
  const matchInput = existing.map((tag) => ({
    id: tag.id,
    name: tag.name,
    aliases: (tag.aliases as string[] | null) ?? []
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
    aliases: (concept.aliases as string[] | null) ?? []
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
    for (const name of names) result.set(name, { id: concept.id, canonicalName: concept.canonicalName });
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/services/knowledge-graph/service.test.ts`

Expected: PASS.

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/knowledge-graph/service.ts src/lib/services/knowledge-graph/service.test.ts
git commit -m "feat: persist card knowledge graph"
```

## Task 5: Persist Graph Data During Card Creation

**Files:**
- Modify: `src/lib/services/card/service.ts`
- Create: `src/lib/services/card/service.test.ts`

- [ ] **Step 1: Write failing service test**

Create `src/lib/services/card/service.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/lib/services/card/service.test.ts`

Expected: FAIL because `createDraftCard` does not persist graph data and its generated type does not accept concept fields.

- [ ] **Step 3: Modify card service input and persistence**

In `src/lib/services/card/service.ts`, import:

```ts
import { persistCardKnowledgeGraph } from "@/lib/services/knowledge-graph/service";
import type { ConceptRelationCandidate, KnowledgeConceptCandidate } from "@/lib/services/knowledge-graph/types";
```

Add generated fields:

```ts
    knowledge_concepts?: KnowledgeConceptCandidate[];
    concept_relations?: ConceptRelationCandidate[];
```

After `prisma.card.create(...)`, before `recordUsage`, add:

```ts
  await persistCardKnowledgeGraph({
    userId: input.userId,
    cardId: card.id,
    tags: input.generated.tags,
    concepts: input.generated.knowledge_concepts ?? [],
    relations: input.generated.concept_relations ?? []
  });
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/services/card/service.test.ts`

Expected: PASS.

- [ ] **Step 5: Run wider tests**

Run: `npm test -- src/lib/services/card/service.test.ts src/lib/services/knowledge-graph/service.test.ts src/lib/validators/card.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/card/service.ts src/lib/services/card/service.test.ts
git commit -m "feat: attach graph data to new cards"
```

## Task 6: Prompt Graph Context And Contract

**Files:**
- Modify: `src/lib/services/ai-orchestration/service.ts`
- Modify: `src/lib/providers/llm/types.ts`
- Modify: `src/lib/providers/llm/mock.ts`
- Modify: `src/lib/prompts/*.zh.md`
- Modify: `src/lib/prompts/prompt-contract.test.ts`
- Modify: `src/lib/services/ai-orchestration/service.test.ts`

- [ ] **Step 1: Add failing prompt contract test**

Append to `src/lib/prompts/prompt-contract.test.ts`:

```ts
test("Chinese card prompts request canonical knowledge concepts and controlled relations", () => {
  for (const file of [
    "content_view.zh.md",
    "general_summary.zh.md",
    "content_creator.zh.md",
    "startup_product.zh.md",
    "investment_info.zh.md",
    "tool_app.zh.md",
    "learning_note.zh.md"
  ]) {
    const prompt = readFileSync(path.join(process.cwd(), "src/lib/prompts", file), "utf8");
    assert.ok(prompt.includes("knowledge_concepts"), file);
    assert.ok(prompt.includes("concept_relations"), file);
    assert.ok(prompt.includes("related_to"), file);
    assert.ok(prompt.includes("优先复用已有知识点"), file);
  }
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/lib/prompts/prompt-contract.test.ts`

Expected: FAIL because prompts do not mention concepts and relations.

- [ ] **Step 3: Update provider input type**

In `src/lib/providers/llm/types.ts`, add:

```ts
export interface GraphPromptContext {
  tags: Array<{ id: string; name: string; aliases: string[] }>;
  concepts: Array<{ id: string; name: string; aliases: string[]; description: string | null }>;
}
```

Then add optional `graphContext?: GraphPromptContext` to the generate-card input interface.

- [ ] **Step 4: Fetch bounded graph context in orchestration**

In `src/lib/services/ai-orchestration/service.ts`, import Prisma and add a helper:

```ts
import { prisma } from "@/lib/db/prisma";

async function getGraphPromptContext(userId: string) {
  const [tags, concepts] = await Promise.all([
    prisma.tag.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 40 }),
    prisma.knowledgeConcept.findMany({ where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 80 })
  ]);
  return {
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name, aliases: (tag.aliases as string[] | null) ?? [] })),
    concepts: concepts.map((concept) => ({
      id: concept.id,
      name: concept.canonicalName,
      aliases: (concept.aliases as string[] | null) ?? [],
      description: concept.description
    }))
  };
}
```

Before provider call:

```ts
  const graphContext = await getGraphPromptContext(input.userId);
```

Pass to `provider.generateCard`:

```ts
      graphContext
```

- [ ] **Step 5: Update prompts**

In every active Chinese prompt template, add this contract near the JSON field list:

```md
knowledge_concepts, concept_relations。
```

Add rules:

```md
- knowledge_concepts：抽取 3-7 个长期可复用知识点。知识点必须是词语或短语，值得单独解释，可能在未来至少 10 张卡片中复用，并能连接其他知识点。优先复用已有知识点，不要为同一含义创造不同表达。
- concept_relations：抽取 0-5 条知识点之间的关系。只使用这些 relation_type：is_a, part_of, uses, depends_on, implemented_by, based_on, solves, improves, replaces, similar_to, alternative_to, belongs_to, created_by, developed_by, competes_with, applies_to, related_to。只有无法判断更具体关系时才使用 related_to。
```

- [ ] **Step 6: Update mock provider**

In `src/lib/providers/llm/mock.ts`, include:

```ts
      knowledge_concepts: [
        { name: "RAG", aliases: ["Retrieval-Augmented Generation"], relevance: "high", evidence: "模拟卡片包含可复用知识点" }
      ],
      concept_relations: []
```

- [ ] **Step 7: Run prompt and orchestration tests**

Run: `npm test -- src/lib/prompts/prompt-contract.test.ts src/lib/services/ai-orchestration/service.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/services/ai-orchestration/service.ts src/lib/providers/llm src/lib/prompts src/lib/prompts/prompt-contract.test.ts src/lib/services/ai-orchestration/service.test.ts
git commit -m "feat: request graph candidates during card generation"
```

## Task 7: Dashboard Serialization And Related Cards

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/lib/dashboard/card-view-model.ts`
- Modify: `src/lib/dashboard/card-view-model.test.ts`

- [ ] **Step 1: Write failing view-model test**

Append to `src/lib/dashboard/card-view-model.test.ts`:

```ts
test("filterDashboardCards searches knowledge concept names", () => {
  const filtered = filterDashboardCards([
    {
      ...cards[0],
      knowledgeConcepts: [{ id: "concept-1", name: "RAG", description: null, relevance: "high", evidence: null }],
      relatedCards: []
    }
  ], {
    query: "rag",
    selectedRoleIds: ["all"],
    activeTag: "",
    sort: "desc"
  });

  assert.deepEqual(filtered.map((card) => card.id), ["card-1"]);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/lib/dashboard/card-view-model.test.ts`

Expected: FAIL because `DashboardCard` does not have concept fields and search does not include them.

- [ ] **Step 3: Extend dashboard types and search**

In `src/lib/dashboard/card-view-model.ts`, import:

```ts
import type { SerializedKnowledgeConcept, SerializedRelatedCard } from "@/lib/services/knowledge-graph/types";
```

Add fields to `DashboardCard`:

```ts
  knowledgeConcepts: SerializedKnowledgeConcept[];
  relatedCards: SerializedRelatedCard[];
```

Update search text:

```ts
      return [
        card.title,
        card.summary,
        card.sourceTitle ?? "",
        card.tags.join(" "),
        card.knowledgeConcepts.map((concept) => concept.name).join(" ")
      ]
```

- [ ] **Step 4: Include graph relations in dashboard query**

In `src/app/dashboard/page.tsx`, update `findMany`:

```ts
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
    },
```

Change serializer signature to accept the included type. Add:

```ts
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
```

Add serialized fields:

```ts
    knowledgeConcepts: card.cardConcepts.map((item) => ({
      id: item.concept.id,
      name: item.concept.canonicalName,
      description: item.concept.description,
      relevance: item.relevance,
      evidence: item.evidence
    })),
    relatedCards: buildRelatedCards(card),
```

Add helper:

```ts
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
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/lib/dashboard/card-view-model.test.ts`

Expected: PASS.

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/lib/dashboard/card-view-model.ts src/lib/dashboard/card-view-model.test.ts
git commit -m "feat: serialize card knowledge graph"
```

## Task 8: Card Detail UI For Concepts And Related Cards

**Files:**
- Modify: `src/lib/language.ts`
- Modify: `src/components/dashboard/card-detail-modal.tsx`
- Modify: `src/components/dashboard/card-detail-modal.test.ts`

- [ ] **Step 1: Write failing modal contract test**

Append to `src/components/dashboard/card-detail-modal.test.ts`:

```ts
test("card detail modal shows knowledge concepts and related cards", () => {
  assert.ok(modalSource.includes("cardCopy.knowledgeConcepts"));
  assert.ok(modalSource.includes("card.knowledgeConcepts.map"));
  assert.ok(modalSource.includes("cardCopy.relatedCards"));
  assert.ok(modalSource.includes("card.relatedCards.map"));
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/dashboard/card-detail-modal.test.ts`

Expected: FAIL because modal does not render graph sections.

- [ ] **Step 3: Add bilingual labels**

In `src/lib/language.ts`, add to both `zh.card` and `en.card`:

```ts
      knowledgeConcepts: "知识点",
      relatedCards: "相关卡片",
      noRelatedCards: "暂无相关卡片",
```

English:

```ts
      knowledgeConcepts: "Knowledge Concepts",
      relatedCards: "Related Cards",
      noRelatedCards: "No related cards yet",
```

- [ ] **Step 4: Render concepts after key points**

In `src/components/dashboard/card-detail-modal.tsx`, add after the key points `DetailSection`:

```tsx
            <DetailSection title={cardCopy.knowledgeConcepts}>
              <div className="flex flex-wrap gap-2">
                {card.knowledgeConcepts.map((concept) => (
                  <span
                    key={concept.id}
                    title={concept.evidence ?? concept.description ?? concept.name}
                    className="rounded-md border border-[#2f2f2f] bg-[#111111] px-2.5 py-1.5 text-xs text-[#d8d8d5]"
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            </DetailSection>
```

- [ ] **Step 5: Render related cards before tags**

Add before the tag row:

```tsx
            <DetailSection title={cardCopy.relatedCards}>
              {card.relatedCards.length ? (
                <div className="space-y-2">
                  {card.relatedCards.map((related) => (
                    <Link
                      key={related.id}
                      href={`/cards/${related.id}`}
                      className="block rounded-lg border border-[#2f2f2f] bg-[#111111] px-4 py-3 text-sm text-[#d8d8d5] hover:bg-white/[0.06]"
                    >
                      <span className="block font-medium text-[#f3f3f1]">{related.title}</span>
                      <span className="mt-1 block text-xs text-[#b4b4b1]">{related.reason}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-[#2f2f2f] bg-[#111111] px-4 py-3 text-sm text-[#8f8f8a]">
                  {cardCopy.noRelatedCards}
                </p>
              )}
            </DetailSection>
```

- [ ] **Step 6: Run modal tests**

Run: `npm test -- src/components/dashboard/card-detail-modal.test.ts`

Expected: PASS.

- [ ] **Step 7: Run type check**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/language.ts src/components/dashboard/card-detail-modal.tsx src/components/dashboard/card-detail-modal.test.ts
git commit -m "feat: show card knowledge graph"
```

## Task 9: Full Verification And Local QA

**Files:**
- No source files expected. If verification reveals a defect, stop this task and write a new focused fix task with its own failing test, implementation, verification, and exact file list.

- [ ] **Step 1: Run full automated tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 3: Apply migration locally**

Run: `npx prisma migrate dev`

Expected: migration applies and Prisma Client is current.

- [ ] **Step 4: Start local app**

Run: `npm run dev`

Expected: local URL is shown, usually `http://localhost:3000`.

- [ ] **Step 5: Browser QA**

In the browser:

1. Register or log into a local QA account.
2. Create one text card containing concepts such as `RAG`, `Embedding`, and `Hallucination`.
3. Create a second text card that repeats `RAG` and `Hallucination`.
4. Open `/dashboard`.
5. Open the card detail modal.
6. Confirm the modal shows knowledge concepts.
7. Confirm related cards appear with a reason when relation evidence is shared.
8. Search for `RAG` and confirm cards can be found by concept name.
9. Check `/dashboard` at 1440, 768, and 390 width for no horizontal overflow.

- [ ] **Step 6: Inspect graph rows**

Run:

```bash
npx prisma studio
```

Expected:

- `KnowledgeConcept` contains reused concepts rather than duplicates for repeated names.
- `ConceptRelation` contains one edge for the same `(source, relationType, target)`.
- `ConceptRelationEvidence` contains multiple cards supporting the same edge.

- [ ] **Step 7: Stop on verification defects**

If QA reveals a defect, do not make an unplanned fix inside this verification task. Record the exact failing behavior, the command or browser steps that reproduce it, and the files likely involved. Then create a new narrow task before editing code.

## Final Acceptance

The implementation is complete when:

- New cards persist canonical tags, knowledge concepts, concept links, concept relation edges, and relation evidence.
- Repeated equivalent concepts reuse an existing concept by canonical name or alias.
- Repeated equivalent relation edges append evidence instead of creating duplicates.
- Legacy cards without graph data still render.
- Card detail modal shows concepts and related cards without breaking the open design.
- `npm test` passes.
- `npx tsc --noEmit` passes.
- Local browser QA confirms dashboard, modal, search, and responsive layouts.
