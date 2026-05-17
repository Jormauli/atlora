-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "SourceChannel" AS ENUM ('web', 'official_account');
CREATE TYPE "SourceType" AS ENUM ('image', 'text', 'link');
CREATE TYPE "IngestionStatus" AS ENUM ('received', 'processing', 'processed', 'failed');
CREATE TYPE "CardStatus" AS ENUM ('draft', 'saved', 'archived', 'deleted');
CREATE TYPE "CardVisibility" AS ENUM ('private', 'link_visible', 'public', 'paid');
CREATE TYPE "StorageType" AS ENUM ('temp', 'permanent');
CREATE TYPE "FileType" AS ENUM ('image', 'pdf', 'voice', 'doc');
CREATE TYPE "FileStatus" AS ENUM ('active', 'deleted', 'expired');
CREATE TYPE "UsageType" AS ENUM ('ocr', 'llm_input', 'llm_output', 'image_upload', 'card_generate', 'link_fetch');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "nickname" TEXT,
  "avatarUrl" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "primaryUseCase" TEXT,
  "defaultPerspective" TEXT,
  "preferredOutputLength" TEXT,
  "defaultSaveMode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceChannel" "SourceChannel" NOT NULL DEFAULT 'web',
  "sourceType" "SourceType" NOT NULL,
  "rawText" TEXT,
  "rawUrl" TEXT,
  "tempFileId" TEXT,
  "status" "IngestionStatus" NOT NULL DEFAULT 'received',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IngestionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessingResult" (
  "id" TEXT NOT NULL,
  "ingestionItemId" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "extractedTitle" TEXT,
  "sourceMetadata" JSONB,
  "detectedLanguage" TEXT,
  "detectedContentType" TEXT,
  "ocrConfidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcessingResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Card" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "keyPoints" JSONB NOT NULL,
  "actionItems" JSONB NOT NULL,
  "tags" JSONB NOT NULL,
  "category" TEXT NOT NULL,
  "cardType" TEXT NOT NULL,
  "perspective" TEXT NOT NULL,
  "sourceType" "SourceType" NOT NULL,
  "sourceUrl" TEXT,
  "sourceTitle" TEXT,
  "sourceDomain" TEXT,
  "aiTemplateId" TEXT NOT NULL,
  "status" "CardStatus" NOT NULL DEFAULT 'draft',
  "visibility" "CardVisibility" NOT NULL DEFAULT 'private',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "File" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storageType" "StorageType" NOT NULL DEFAULT 'temp',
  "fileType" "FileType" NOT NULL,
  "objectKey" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "status" "FileStatus" NOT NULL DEFAULT 'active',
  "expireAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "usageType" "UsageType" NOT NULL,
  "taskType" TEXT NOT NULL,
  "modelTier" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit" TEXT NOT NULL,
  "costEstimate" DECIMAL(10,6) NOT NULL DEFAULT 0,
  "relatedId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "ProcessingResult_ingestionItemId_key" ON "ProcessingResult"("ingestionItemId");

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestionItem" ADD CONSTRAINT "IngestionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessingResult" ADD CONSTRAINT "ProcessingResult_ingestionItemId_fkey" FOREIGN KEY ("ingestionItemId") REFERENCES "IngestionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
