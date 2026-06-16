import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ingestImage } from "@/lib/services/ingestion/service";
import { detectSupportedImageMimeType, getImageIngestionErrorMessage } from "@/lib/services/image-upload/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  const templateId = String(formData.get("templateId") ?? "auto");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "仅支持 jpg / jpeg / png / webp 图片" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "图片过大，请压缩图片或更换图片。" }, { status: 400 });
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectSupportedImageMimeType(buffer);
    if (!mimeType) {
      return NextResponse.json({ error: "图片内容不合法，请重新选择 jpg / jpeg / png / webp 图片。" }, { status: 400 });
    }
    const card = await ingestImage({
      userId: user.id,
      file: {
        userId: user.id,
        originalName: file.name,
        mimeType,
        sizeBytes: file.size,
        buffer
      },
      templateId,
      defaultPerspective: user.profile?.defaultPerspective
    });
    return NextResponse.json({ card });
  } catch (error) {
    return NextResponse.json({ error: getImageIngestionErrorMessage(error) }, { status: 500 });
  }
}
