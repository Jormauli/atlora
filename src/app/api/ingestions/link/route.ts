import { NextResponse } from "next/server";
import { captureServerEvent, domainFromUrl } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/auth/session";
import { linkIngestionSchema } from "@/lib/validators/ingestion";
import { ingestLink, resolveTemplate } from "@/lib/services/ingestion/service";
import { getTaskQueue } from "@/lib/services/task-queue";
import { prisma } from "@/lib/db/prisma";
import { isWeChatArticleUrl, tryHtmlExtraction } from "@/lib/services/link-fetcher/wechat";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = linkIngestionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "请输入有效链接" }, { status: 400 });
  const domain = domainFromUrl(parsed.data.url);
  const submittedTemplateId = parsed.data.templateId ?? "auto";
  await captureServerEvent({
    userId: user.id,
    event: "material_submitted",
    properties: { sourceType: "link", templateId: submittedTemplateId, domain }
  });
  const wechatAsyncEnabled = process.env.WECHAT_INGESTION_ENABLED === "true";
  if (!isWeChatArticleUrl(parsed.data.url) || !wechatAsyncEnabled) {
    try {
      const card = await ingestLink({
        userId: user.id,
        url: parsed.data.url,
        templateId: parsed.data.templateId,
        defaultPerspective: user.profile?.defaultPerspective
      });
      await captureServerEvent({
        userId: user.id,
        event: "card_generated",
        properties: { sourceType: "link", templateId: card.aiTemplateId ?? "unknown", status: "completed", domain }
      });
      return NextResponse.json({ card });
    } catch (error) {
      console.error(error);
      await captureServerEvent({
        userId: user.id,
        event: "link_ingestion_failed",
        properties: { sourceType: "link", templateId: submittedTemplateId, domain, status: "failed", failureCode: "SYNC_LINK_FAILED", stage: "failed" }
      });
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
      status: "received",
      stage: "queued"
    }
  });
  await captureServerEvent({
    userId: user.id,
    event: "link_ingestion_started",
    properties: { sourceType: "link", templateId, domain, status: "received", stage: "queued" }
  });
  const html = await tryHtmlExtraction(parsed.data.url);
  if (html) {
    try {
      await prisma.ingestionItem.update({
        where: { id: ingestion.id },
        data: { status: "processing", stage: "extracting_text", processingStartedAt: new Date() }
      });
      await getTaskQueue().enqueueExtracted({
        ingestionId: ingestion.id,
        extracted: {
          title: html.title,
          text: html.text,
          strategy: "wechat_markdown",
          confidence: 1,
          sourceMetadata: {
            strategy: "vercel_html",
            domain: new URL(parsed.data.url).hostname
          }
        }
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
          errorMessage: "正文已识别，但生成任务提交失败，请稍后重试。",
          processingCompletedAt: new Date()
        }
      });
      await captureServerEvent({
        userId: user.id,
        event: "link_ingestion_failed",
        properties: { sourceType: "link", templateId, domain, status: "failed", failureCode: "QUEUE_UNAVAILABLE", stage: "failed" }
      });
      return NextResponse.json({ error: "正文已识别，但生成任务提交失败，请稍后重试。" }, { status: 500 });
    }
  }

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
    await captureServerEvent({
      userId: user.id,
      event: "link_ingestion_failed",
      properties: { sourceType: "link", templateId, domain, status: "failed", failureCode: "QUEUE_UNAVAILABLE", stage: "failed" }
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
