import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { linkIngestionSchema } from "@/lib/validators/ingestion";
import { ingestLink, resolveTemplate } from "@/lib/services/ingestion/service";
import { getTaskQueue } from "@/lib/services/task-queue";
import { prisma } from "@/lib/db/prisma";
import { isWeChatArticleUrl, tryHtmlExtraction } from "@/lib/services/link-fetcher/wechat";
import { generateCardDraft } from "@/lib/services/ai-orchestration/service";
import { createDraftCard } from "@/lib/services/card/service";
import { recordUsage } from "@/lib/services/usage/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = linkIngestionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "请输入有效链接" }, { status: 400 });
  const wechatAsyncEnabled = process.env.WECHAT_INGESTION_ENABLED === "true";
  if (!isWeChatArticleUrl(parsed.data.url) || !wechatAsyncEnabled) {
    try {
      const card = await ingestLink({
        userId: user.id,
        url: parsed.data.url,
        templateId: parsed.data.templateId,
        defaultPerspective: user.profile?.defaultPerspective
      });
      return NextResponse.json({ card });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "生成失败，请稍后重试。" }, { status: 500 });
    }
  }
  const templateId = resolveTemplate(parsed.data.templateId, user.profile?.defaultPerspective);
  const ingestion = await prisma.ingestionItem.create({
    data: {
      userId: user.id,
      sourceType: "link",
      rawUrl: parsed.data.url,
      templateId,
      status: "processing",
      stage: "extracting_text"
    }
  });
  const html = await tryHtmlExtraction(parsed.data.url);
  if (html) {
    try {
      await prisma.ingestionItem.update({
        where: { id: ingestion.id },
        data: { status: "processing", stage: "generating_card" }
      });
      const generated = await generateCardDraft({
        userId: user.id,
        content: [html.title, html.text].filter(Boolean).join("\n"),
        templateId,
        sourceType: "link",
        sourceTitle: html.title,
        sourceDomain: new URL(parsed.data.url).hostname
      });
      await recordUsage({
        userId: user.id,
        usageType: "link_fetch",
        taskType: "basic_summary",
        quantity: 1,
        unit: "url",
        relatedId: ingestion.id
      });
      await prisma.processingResult.create({
        data: {
          ingestionItemId: ingestion.id,
          normalizedText: html.text,
          extractedTitle: html.title,
          detectedContentType: "wechat_markdown",
          sourceMetadata: { strategy: "wechat_html", domain: new URL(parsed.data.url).hostname }
        }
      });
      const card = await createDraftCard({
        userId: user.id,
        ingestionItemId: ingestion.id,
        generated,
        sourceType: "link",
        sourceUrl: parsed.data.url,
        templateId
      });
      await prisma.ingestionItem.update({
        where: { id: ingestion.id },
        data: { status: "processed", stage: "completed", processingCompletedAt: new Date() }
      });
      return NextResponse.json({ ingestionId: ingestion.id });
    } catch (error) {
      console.error(error);
      await prisma.ingestionItem.update({
        where: { id: ingestion.id },
        data: {
          status: "failed",
          stage: "failed",
          failureCode: "CARD_GENERATION_FAILED",
          errorMessage: "正文已识别，但知识卡片生成失败，请稍后重试。",
          processingCompletedAt: new Date()
        }
      });
      return NextResponse.json({ error: "正文已识别，但知识卡片生成失败，请稍后重试。" }, { status: 500 });
    }
  }

  await prisma.ingestionItem.update({
    where: { id: ingestion.id },
    data: { status: "received", stage: "queued" }
  });
  try {
    await getTaskQueue().enqueueWeChat({
      ingestionId: ingestion.id,
      url: parsed.data.url
    });
    return NextResponse.json({ ingestionId: ingestion.id }, { status: 202 });
  } catch (error) {
    console.error(error);
    await prisma.ingestionItem.update({
      where: { id: ingestion.id },
      data: {
        status: "failed",
        stage: "failed",
        failureCode: "QUEUE_UNAVAILABLE",
        errorMessage: "链接处理服务暂时不可用，请稍后重试。",
        processingCompletedAt: new Date()
      }
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? `提交失败：${error.message}`
            : "链接处理服务暂时不可用，请稍后重试。"
      },
      { status: 500 }
    );
  }
}
