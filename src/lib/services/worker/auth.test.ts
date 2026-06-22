import assert from "node:assert/strict";
import test from "node:test";
import { authenticateWorkerCallback } from "./auth";
import { signWorkerRequest } from "./signature";

test("authenticates the exact callback body and path", async () => {
  process.env.WORKER_CALLBACK_SECRET = "test-secret";
  const body = JSON.stringify({ stage: "opening_article" });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signWorkerRequest({
    secret: "test-secret",
    method: "POST",
    pathname: "/api/internal/ingestions/ing-1/stage",
    timestamp: Number(timestamp),
    ingestionId: "ing-1",
    body
  });
  const request = new Request("https://atlora.test/api/internal/ingestions/ing-1/stage", {
    method: "POST",
    headers: { "x-atlora-timestamp": timestamp, "x-atlora-signature": signature },
    body
  });
  const result = await authenticateWorkerCallback(request, "ing-1");
  assert.equal(result.ok, true);
  assert.equal(result.body, body);
});

test("rejects a callback whose body was changed", async () => {
  process.env.WORKER_CALLBACK_SECRET = "test-secret";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signWorkerRequest({
    secret: "test-secret",
    method: "POST",
    pathname: "/api/internal/ingestions/ing-1/failed",
    timestamp: Number(timestamp),
    ingestionId: "ing-1",
    body: "{}"
  });
  const request = new Request("https://atlora.test/api/internal/ingestions/ing-1/failed", {
    method: "POST",
    headers: { "x-atlora-timestamp": timestamp, "x-atlora-signature": signature },
    body: JSON.stringify({ failureCode: "BLOCKED" })
  });
  assert.equal((await authenticateWorkerCallback(request, "ing-1")).ok, false);
});
