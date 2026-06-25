import { NextResponse } from "next/server";
import { applyWorkerStage } from "@/lib/services/ingestion/async-service";
import { authenticateWorkerCallback } from "@/lib/services/worker/auth";
import { workerStageSchema } from "@/lib/services/worker/contracts";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authenticated = await authenticateWorkerCallback(request, params.id);
  if (!authenticated.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = workerStageSchema.safeParse(safeJson(authenticated.body));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  const result = await applyWorkerStage(params.id, parsed.data);
  if (result.kind === "missing") return NextResponse.json({ error: "not found" }, { status: 404 });
  if (result.kind === "invalid_transition") {
    return NextResponse.json({ error: "invalid transition" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

function safeJson(input: string) {
  try { return JSON.parse(input); } catch { return null; }
}
