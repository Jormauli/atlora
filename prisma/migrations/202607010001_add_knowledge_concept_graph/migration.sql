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
