import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { linkIngestionSchema } from "@/lib/validators/ingestion";
import { ingestLink } from "@/lib/services/ingestion/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const parsed = linkIngestionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "请输入有效链接" }, { status: 400 });
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
