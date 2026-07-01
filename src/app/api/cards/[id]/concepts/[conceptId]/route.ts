import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/auth/session";
import { ManualConceptError, removeManualCardConcept } from "@/lib/services/knowledge-graph/service";

export async function DELETE(_: Request, { params }: { params: { id: string; conceptId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const concepts = await removeManualCardConcept({ userId: user.id, cardId: params.id, conceptId: params.conceptId });
    await captureServerEvent({
      userId: user.id,
      event: "knowledge_concept_removed",
      properties: { conceptSource: "user" }
    });
    return NextResponse.json({ concepts });
  } catch (error) {
    if (error instanceof ManualConceptError) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    throw error;
  }
}
