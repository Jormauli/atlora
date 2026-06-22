import { createHash, createHmac, timingSafeEqual } from "crypto";

type SignableWorkerRequest = {
  method: string;
  pathname: string;
  timestamp: number;
  ingestionId: string;
  body: string;
  secret: string;
};

function canonicalRequest(input: Omit<SignableWorkerRequest, "secret">) {
  const bodyDigest = createHash("sha256").update(input.body).digest("hex");
  return [input.method.toUpperCase(), input.pathname, input.timestamp, input.ingestionId, bodyDigest].join("\n");
}

export function signWorkerRequest(input: SignableWorkerRequest) {
  return createHmac("sha256", input.secret)
    .update(canonicalRequest(input))
    .digest("hex");
}

export function verifyWorkerRequest(input: SignableWorkerRequest & {
  signature: string;
  nowSeconds?: number;
  maxAgeSeconds?: number;
}) {
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = input.maxAgeSeconds ?? 300;
  if (!Number.isInteger(input.timestamp) || Math.abs(nowSeconds - input.timestamp) > maxAgeSeconds) return false;
  if (!/^[a-f0-9]{64}$/i.test(input.signature)) return false;
  const expected = Buffer.from(signWorkerRequest(input), "hex");
  const received = Buffer.from(input.signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

