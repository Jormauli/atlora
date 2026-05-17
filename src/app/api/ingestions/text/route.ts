import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { textIngestionSchema } from "@/lib/validators/ingestion";
import { ingestText } from "@/lib/services/ingestion/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = textIngestionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "请输入有效文本" }, { status: 400 });
  try {
    const card = await ingestText({
      userId: user.id,
      text: parsed.data.text,
      templateId: parsed.data.templateId,
      defaultPerspective: user.profile?.defaultPerspective
    });
    return NextResponse.json({ card });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? `生成失败：${error.message}`
            : "生成失败，请稍后重试。"
      },
      { status: 500 }
    );
  }
}
