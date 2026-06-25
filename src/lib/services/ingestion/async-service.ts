import type { IngestionStage } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generateCardDraft } from "@/lib/services/ai-orchestration/service";
import { createDraftCard } from "@/lib/services/card/service";
import { canTransitionIngestionStage, type IngestionStageValue } from "@/lib/services/ingestion/state";
import type { WorkerExtracted, WorkerFailed, WorkerStage } from "@/lib/services/worker/contracts";

export async function applyWorkerStage(ingestionId: string, update: WorkerStage) {
  const ingestion = await prisma.ingestionItem.findUnique({ where: { id: ingestionId } });
  if (!ingestion) return { kind: "missing" as const };
  if (ingestion.stage === "completed" || ingestion.stage === "failed") {
    return { kind: "terminal" as const, stage: ingestion.stage };
  }
  if (!canTransitionIngestionStage(ingestion.stage, update.stage)) {
    return { kind: "invalid_transition" as const, stage: ingestion.stage };
  }
  await prisma.ingestionItem.update({
    where: { id: ingestionId },
    data: {
      stage: update.stage as IngestionStage,
      status: "processing",
      processingStartedAt: ingestion.processingStartedAt ?? new Date()
    }
  });
  return { kind: "updated" as const, stage: update.stage };
}

export async function failWorkerIngestion(ingestionId: string, failure: WorkerFailed) {
  const result = await prisma.ingestionItem.updateMany({
    where: { id: ingestionId, stage: { notIn: ["completed", "failed"] } },
    data: {
      status: "failed",
      stage: "failed",
      failureCode: failure.failureCode,
      errorMessage: failure.message,
      processingCompletedAt: new Date()
    }
  });
  return { changed: result.count === 1 };
}

export async function completeWorkerExtraction(ingestionId: string, extracted: WorkerExtracted) {
  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.ingestionItem.updateMany({
      where: {
        id: ingestionId,
        stage: { in: ["extracting_text", "recognizing_text"] },
        status: { in: ["received", "processing"] }
      },
      data: { stage: "generating_card", status: "processing" }
    });
    if (result.count !== 1) return false;
    await tx.processingResult.upsert({
      where: { ingestionItemId: ingestionId },
      create: {
        ingestionItemId: ingestionId,
        normalizedText: extracted.text,
        extractedTitle: extracted.title,
        detectedContentType: extracted.strategy,
        ocrConfidence: extracted.confidence,
        sourceMetadata: sanitizeSourceMetadata(extracted.sourceMetadata)
      },
      update: {
        normalizedText: extracted.text,
        extractedTitle: extracted.title,
        detectedContentType: extracted.strategy,
        ocrConfidence: extracted.confidence,
        sourceMetadata: sanitizeSourceMetadata(extracted.sourceMetadata)
      }
    });
    return true;
  });

  if (!claimed) {
    const existing = await prisma.ingestionItem.findUnique({
      where: { id: ingestionId },
      include: { card: { select: { id: true } } }
    });
    if (!existing) return { kind: "missing" as const };
    return { kind: "duplicate" as const, cardId: existing.card?.id ?? null };
  }

  const ingestion = await prisma.ingestionItem.findUnique({ where: { id: ingestionId } });
  if (!ingestion?.rawUrl || !ingestion.templateId) {
    await failWorkerIngestion(ingestionId, {
      failureCode: "INVALID_INGESTION",
      message: "链接任务缺少必要信息。",
      retryable: false
    });
    return { kind: "failed" as const };
  }

  try {
    const domain = new URL(ingestion.rawUrl).hostname;
    const generated = await generateCardDraft({
      userId: ingestion.userId,
      content: [extracted.title, extracted.text].filter(Boolean).join("\n"),
      templateId: ingestion.templateId,
      sourceType: "link",
      sourceTitle: extracted.title,
      sourceDomain: domain
    });
    const card = await createDraftCard({
      userId: ingestion.userId,
      ingestionItemId: ingestionId,
      generated,
      sourceType: "link",
      sourceUrl: ingestion.rawUrl,
      templateId: ingestion.templateId
    });
    await prisma.ingestionItem.update({
      where: { id: ingestionId },
      data: {
        status: "processed",
        stage: "completed",
        failureCode: null,
        errorMessage: null,
        processingCompletedAt: new Date()
      }
    });
    return { kind: "completed" as const, cardId: card.id };
  } catch (error) {
    await failWorkerIngestion(ingestionId, {
      failureCode: "CARD_GENERATION_FAILED",
      message: "正文已识别，但知识卡片生成失败，请稍后重试。",
      retryable: true
    });
    throw error;
  }
}

function sanitizeSourceMetadata(metadata: WorkerExtracted["sourceMetadata"]) {
  if (!metadata) return undefined;
  return JSON.parse(JSON.stringify(metadata));
}
