import { verifyWorkerRequest } from "@/lib/services/worker/signature";

export async function authenticateWorkerCallback(request: Request, ingestionId: string) {
  const secret = process.env.WORKER_CALLBACK_SECRET;
  const timestamp = request.headers.get("x-atlora-timestamp");
  const signature = request.headers.get("x-atlora-signature");
  const body = await request.text();

  if (!secret || !timestamp || !signature) return { ok: false as const, body };

  const url = new URL(request.url);
  return {
    ok: verifyWorkerRequest({
      secret,
      method: request.method,
      pathname: url.pathname,
      timestamp: Number(timestamp),
      ingestionId,
      body,
      signature
    }),
    body
  };
}
