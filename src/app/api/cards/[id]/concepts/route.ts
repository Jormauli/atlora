import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { addManualCardConcept, ManualConceptError } from "@/lib/services/knowledge-graph/service";

const conceptInputSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const parsed = conceptInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "知识点不能为空，且不能超过 80 个字符" }, { status: 400 });
  }

  try {
    const concepts = await addManualCardConcept({ userId: user.id, cardId: params.id, name: parsed.data.name });
    return NextResponse.json({ concepts });
  } catch (error) {
    if (error instanceof ManualConceptError) {
      const status = error.code === "CARD_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: status === 404 ? "未找到" : "知识点不合法" }, { status });
    }
    throw error;
  }
}
