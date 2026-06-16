import test from "node:test";
import assert from "node:assert/strict";
import { fetchLinkContent } from "./service";

test("fetchLinkContent rejects loopback urls before calling fetch", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("<html><body>private</body></html>", {
      headers: { "Content-Type": "text/html" }
    });
  }) as typeof fetch;

  try {
    const fetched = await fetchLinkContent({
      userId: "user-1",
      url: "http://127.0.0.1/admin",
      relatedId: "ingestion-1"
    });

    assert.equal(fetched.ok, false);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchLinkContent parses html responses only", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{"title":"not html"}', {
      headers: { "Content-Type": "application/json" }
    })) as typeof fetch;

  try {
    const fetched = await fetchLinkContent({
      userId: "user-1",
      url: "https://example.com/material.json",
      relatedId: "ingestion-2"
    });

    assert.equal(fetched.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
