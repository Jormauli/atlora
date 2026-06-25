import { NextResponse } from "next/server";
import { completeWorkerExtraction } from "@/lib/services/ingestion/async-service";
import { authenticateWorkerCallback } from "@/lib/services/worker/auth";
import { workerExtractedSchema } from "@/lib/services/worker/contracts";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authenticated = await authenticateWorkerCallback(request, params.id);
  if (!authenticated.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = workerExtractedSchema.safeParse(safeJson(authenticated.body));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  const result = await completeWorkerExtraction(params.id, parsed.data);
  if (result.kind === "missing") return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}

function safeJson(input: string) {
  try { return JSON.parse(input); } catch { return null; }
}
