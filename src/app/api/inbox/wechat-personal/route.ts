import { NextResponse } from "next/server";
import { z } from "zod";
import { handlePersonalWeChatMessage } from "@/lib/services/wechat-personal/service";

const messageSchema = z.object({
  sender: z.string().trim().optional(),
  text: z.string().trim().min(1),
  receivedAt: z.string().trim().optional()
});

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "消息格式不合法" }, { status: 400 });
  }

  try {
    const result = await handlePersonalWeChatMessage(parsed.data);
    return NextResponse.json({
      ok: true,
      kind: result.kind,
      card: {
        id: result.card.id,
        title: result.card.title,
        status: result.card.status
      },
      draftUrl: `/cards/${result.card.id}/draft`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? `个人微信消息处理失败：${error.message}`
            : "个人微信消息处理失败"
      },
      { status: 500 }
    );
  }
}

function isAuthorized(request: Request) {
  const expected = process.env.WECHAT_PERSONAL_WEBHOOK_TOKEN;
  if (!expected) return false;
  const authorization = request.headers.get("authorization");
  const headerToken = request.headers.get("x-webhook-token");
  return authorization === `Bearer ${expected}` || headerToken === expected;
}
