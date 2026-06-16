import { prisma } from "@/lib/db/prisma";
import { getOCRProvider } from "@/lib/providers/ocr";
import { getStorageProvider } from "@/lib/providers/storage";
import type { UploadedFile } from "@/lib/providers/storage/types";
import { generateCardDraft } from "@/lib/services/ai-orchestration/service";
import { createDraftCard } from "@/lib/services/card/service";
import { fetchLinkContent } from "@/lib/services/link-fetcher/service";
import { recordUsage } from "@/lib/services/usage/service";
import { parseSelectedContentViews } from "@/lib/content-views";

export function resolveTemplate(templateId: string, defaultPerspective?: string | null) {
  if (templateId !== "auto") return templateId;
  const selectedViews = parseSelectedContentViews(defaultPerspective);
  return selectedViews.length ? `content_view__${selectedViews.join(",")}` : "content_view";
}

export async function ingestText(input: {
  userId: string;
  text: string;
  templateId: string;
  defaultPerspective?: string | null;
}) {
  const ingestion = await prisma.ingestionItem.create({
    data: { userId: input.userId, sourceType: "text", rawText: input.text, status: "processing" }
  });
  const templateId = resolveTemplate(input.templateId, input.defaultPerspective);
  const generated = await generateCardDraft({
    userId: input.userId,
    content: input.text,
    templateId,
    sourceType: "text"
  });
  await prisma.processingResult.create({
    data: { ingestionItemId: ingestion.id, normalizedText: input.text, detectedLanguage: "zh" }
  });
  await prisma.ingestionItem.update({ where: { id: ingestion.id }, data: { status: "processed" } });
  return createDraftCard({ userId: input.userId, generated, sourceType: "text", templateId });
}

export async function ingestImage(input: {
  userId: string;
  file: UploadedFile;
  templateId: string;
  defaultPerspective?: string | null;
}) {
  const storage = getStorageProvider();
  const fileRef = await storage.saveTempFile(input.file);
  await recordUsage({
    userId: input.userId,
    usageType: "image_upload",
    taskType: "vision_analysis",
    quantity: 1,
    unit: "file",
    relatedId: fileRef.id
  });
  const ingestion = await prisma.ingestionItem.create({
    data: { userId: input.userId, sourceType: "image", tempFileId: fileRef.id, status: "processing" }
  });
  try {
    const ocr = await getOCRProvider().extractText(fileRef);
    if (!isUsableOCRText(ocr.text, ocr.confidence)) {
      throw new Error("OCR text quality is too low");
    }
    await recordUsage({
      userId: input.userId,
      usageType: "ocr",
      taskType: "vision_analysis",
      provider: process.env.OCR_PROVIDER ?? "mock",
      modelName: process.env.OCR_PROVIDER ?? "mock",
      relatedId: ingestion.id
    });
    const templateId = resolveTemplate(input.templateId, input.defaultPerspective);
    const generated = await generateCardDraft({
      userId: input.userId,
      content: ocr.text,
      templateId,
      sourceType: "image"
    });
    await prisma.processingResult.create({
      data: {
        ingestionItemId: ingestion.id,
        normalizedText: ocr.text,
        detectedLanguage: "zh",
        detectedContentType: "image",
        ocrConfidence: ocr.confidence
      }
    });
    await prisma.ingestionItem.update({ where: { id: ingestion.id }, data: { status: "processed" } });
    return createDraftCard({ userId: input.userId, generated, sourceType: "image", templateId });
  } catch (error) {
    await prisma.ingestionItem.update({
      where: { id: ingestion.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "OCR failed"
      }
    });
    throw new Error("图片识别失败，请换一张更清晰的截图，或手动输入文本。");
  }
}

export function isUsableOCRText(text: string, confidence: number) {
  const minConfidence = Number(process.env.IMAGE_OCR_MIN_CONFIDENCE ?? 0.55);
  const minChars = Number(process.env.IMAGE_OCR_MIN_CHARS ?? 20);
  return text.replace(/\s+/g, "").length >= minChars && confidence >= minConfidence;
}

export async function ingestLink(input: {
  userId: string;
  url: string;
  templateId: string;
  defaultPerspective?: string | null;
}) {
  const ingestion = await prisma.ingestionItem.create({
    data: { userId: input.userId, sourceType: "link", rawUrl: input.url, status: "processing" }
  });
  const fetched = await fetchLinkContent({
    userId: input.userId,
    url: input.url,
    relatedId: ingestion.id
  });
  await recordUsage({
    userId: input.userId,
    usageType: "link_fetch",
    taskType: "basic_summary",
    quantity: 1,
    unit: "url",
    relatedId: ingestion.id
  });
  const templateId = resolveTemplate(input.templateId, input.defaultPerspective);
  const content = fetched.ok
    ? [fetched.title, fetched.description, fetched.text].filter(Boolean).join("\n")
    : `待读链接：${input.url}\n${fetched.hint ?? "链接正文无法读取，已保存链接。你可以补充截图或正文。"}`;
  const generated = await generateCardDraft({
    userId: input.userId,
    content,
    templateId,
    sourceType: "link",
    sourceTitle: fetched.title ?? "待读链接",
    sourceDomain: fetched.domain
  });
  if (!fetched.ok) {
    generated.title = "待读链接";
    generated.summary = fetched.hint ?? "链接正文无法读取，已保存链接。你可以补充截图或正文。";
    generated.action_items = ["使用公众号自带下载截图功能后上传图片，或补充正文后重新生成"];
  }
  await prisma.processingResult.create({
    data: {
      ingestionItemId: ingestion.id,
      normalizedText: content,
      extractedTitle: fetched.title,
      sourceMetadata: JSON.parse(JSON.stringify(fetched)),
      detectedContentType: fetched.ok ? fetched.strategy ?? "webpage" : "unreadable_link",
      ocrConfidence: fetched.ocrConfidence
    }
  });
  await prisma.ingestionItem.update({ where: { id: ingestion.id }, data: { status: "processed" } });
  return createDraftCard({
    userId: input.userId,
    generated,
    sourceType: "link",
    sourceUrl: input.url,
    templateId
  });
}
