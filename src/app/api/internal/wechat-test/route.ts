import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getTaskQueue } from "@/lib/services/task-queue";
import { isWeChatArticleUrl } from "@/lib/services/link-fetcher/wechat";
import { resolveTemplate } from "@/lib/services/ingestion/service";
import { verifyWorkerRequest } from "@/lib/services/worker/signature";

export const WECHAT_TEST_SIGNATURE_ID = "wechat-test";

const bodySchema = z.object({
  userId: z.string().min(1),
  url: z.string().url(),
  templateId: z.string().optional()
});

export async function POST(request: Request) {
  const secret = process.env.WORKER_CALLBACK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const timestamp = request.headers.get("x-atlora-timestamp");
  const signature = request.headers.get("x-atlora-signature");
  if (!timestamp || !signature) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bodyText = await request.text();
  const url = new URL(request.url);
  const valid = verifyWorkerRequest({
    secret,
    method: "POST",
    pathname: url.pathname,
    timestamp: Number(timestamp),
    ingestionId: WECHAT_TEST_SIGNATURE_ID,
    body: bodyText,
    signature
  });
  if (!valid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: unknown;
  try { payload = JSON.parse(bodyText); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  if (!isWeChatArticleUrl(parsed.data.url)) return NextResponse.json({ error: "not a wechat url" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const templateId = resolveTemplate(parsed.data.templateId ?? "auto", null);
  const ingestion = await prisma.ingestionItem.create({
    data: {
      userId: parsed.data.userId,
      sourceType: "link",
      rawUrl: parsed.data.url,
      templateId,
      status: "received",
      stage: "queued"
    }
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
        errorMessage: "internal test: queue unavailable",
        processingCompletedAt: new Date()
      }
    });
    return NextResponse.json({ error: "queue unavailable" }, { status: 500 });
  }
}
