import test from "node:test";
import assert from "node:assert/strict";
import { signWorkerRequest, verifyWorkerRequest } from "./signature";

const secret = "test-worker-secret-with-enough-entropy";
const request = {
  method: "POST",
  pathname: "/api/internal/ingestions/ing_123/extracted",
  timestamp: 1_750_000_000,
  ingestionId: "ing_123",
  body: JSON.stringify({ title: "标题", text: "正文" })
};

test("worker request signatures verify for the exact canonical request", () => {
  const signature = signWorkerRequest({ ...request, secret });
  assert.equal(
    verifyWorkerRequest({ ...request, secret, signature, nowSeconds: request.timestamp + 30 }),
    true
  );
});

test("worker request signatures reject changed bodies and signatures", () => {
  const signature = signWorkerRequest({ ...request, secret });
  assert.equal(
    verifyWorkerRequest({ ...request, body: `${request.body} `, secret, signature, nowSeconds: request.timestamp }),
    false
  );
  assert.equal(
    verifyWorkerRequest({ ...request, secret, signature: "00".repeat(32), nowSeconds: request.timestamp }),
    false
  );
});

test("worker request signatures reject expired and future timestamps", () => {
  const signature = signWorkerRequest({ ...request, secret });
  assert.equal(
    verifyWorkerRequest({ ...request, secret, signature, nowSeconds: request.timestamp + 301 }),
    false
  );
  assert.equal(
    verifyWorkerRequest({ ...request, secret, signature, nowSeconds: request.timestamp - 301 }),
    false
  );
});
