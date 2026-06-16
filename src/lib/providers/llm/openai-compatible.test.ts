import test from "node:test";
import assert from "node:assert/strict";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { ModelRouteResult } from "@/lib/model-router";

const route: ModelRouteResult = {
  tier: "medium",
  provider: "openai-compatible",
  model: "test-model",
  maxInputTokens: 16000,
  maxOutputTokens: 321,
  reason: "test"
};

test("OpenAICompatibleProvider passes output limits and an abort signal", async () => {
  process.env.LLM_BASE_URL = "https://llm.example.test";
  process.env.LLM_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;
  let requestSignal: AbortSignal | null | undefined;
  globalThis.fetch = (async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    requestSignal = init?.signal;
    return jsonResponse({
      choices: [{ message: { content: '{"title":"Card"}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    });
  }) as typeof fetch;

  try {
    await new OpenAICompatibleProvider().generateCard(
      { prompt: "prompt", content: "content", templateId: "general_summary" },
      route
    );

    assert.equal(requestBody?.max_tokens, route.maxOutputTokens);
    assert.ok(requestSignal instanceof AbortSignal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenAICompatibleProvider retries one transient server error", async () => {
  process.env.LLM_BASE_URL = "https://llm.example.test";
  process.env.LLM_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls === 1) return new Response("temporary", { status: 503 });
    return jsonResponse({
      choices: [{ message: { content: '{"title":"Card"}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    });
  }) as typeof fetch;

  try {
    await new OpenAICompatibleProvider().generateCard(
      { prompt: "prompt", content: "content", templateId: "general_summary" },
      route
    );

    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
