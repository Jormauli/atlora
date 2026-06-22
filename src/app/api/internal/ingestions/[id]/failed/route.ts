import { NextResponse } from "next/server";
import { failWorkerIngestion } from "@/lib/services/ingestion/async-service";
import { authenticateWorkerCallback } from "@/lib/services/worker/auth";
import { workerFailedSchema } from "@/lib/services/worker/contracts";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authenticated = await authenticateWorkerCallback(request, params.id);
  if (!authenticated.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = workerFailedSchema.safeParse(safeJson(authenticated.body));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  await failWorkerIngestion(params.id, parsed.data);
  return NextResponse.json({ ok: true });
}

function safeJson(input: string) {
  try { return JSON.parse(input); } catch { return null; }
}
