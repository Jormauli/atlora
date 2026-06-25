CREATE TYPE "IngestionStage" AS ENUM (
  'queued',
  'opening_article',
  'extracting_text',
  'capturing_screenshot',
  'recognizing_text',
  'generating_card',
  'completed',
  'failed'
);

ALTER TABLE "IngestionItem"
  ADD COLUMN "stage" "IngestionStage" NOT NULL DEFAULT 'queued',
  ADD COLUMN "templateId" TEXT,
  ADD COLUMN "failureCode" TEXT,
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processingCompletedAt" TIMESTAMP(3);

ALTER TABLE "Card" ADD COLUMN "ingestionItemId" TEXT;

CREATE UNIQUE INDEX "Card_ingestionItemId_key" ON "Card"("ingestionItemId");
CREATE INDEX "Card_userId_status_createdAt_idx" ON "Card"("userId", "status", "createdAt");
CREATE INDEX "IngestionItem_userId_status_createdAt_idx" ON "IngestionItem"("userId", "status", "createdAt");
CREATE INDEX "IngestionItem_userId_createdAt_idx" ON "IngestionItem"("userId", "createdAt");
CREATE INDEX "UsageLedger_userId_createdAt_idx" ON "UsageLedger"("userId", "createdAt");

ALTER TABLE "Card"
  ADD CONSTRAINT "Card_ingestionItemId_fkey"
  FOREIGN KEY ("ingestionItemId") REFERENCES "IngestionItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
