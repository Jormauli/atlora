import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { linkIngestionSchema } from "@/lib/validators/ingestion";
import { resolveTemplate } from "@/lib/services/ingestion/service";
import { getTaskQueue } from "@/lib/services/task-queue";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = linkIngestionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "请输入有效链接" }, { status: 400 });
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
