import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ingestImage } from "@/lib/services/ingestion/service";

const allowed = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  const templateId = String(formData.get("templateId") ?? "auto");
  if (!(file instanceof File) || !allowed.includes(file.type)) {
    return NextResponse.json({ error: "仅支持 jpg / jpeg / png / webp 图片" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "图片过大，请压缩图片或更换图片。" }, { status: 400 });
  }
  try {
    const card = await ingestImage({
      userId: user.id,
      file: {
        userId: user.id,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        buffer: Buffer.from(await file.arrayBuffer())
      },
      templateId,
      defaultPerspective: user.profile?.defaultPerspective
    });
    return NextResponse.json({ card });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "生成失败，请稍后重试。" }, { status: 500 });
  }
}
