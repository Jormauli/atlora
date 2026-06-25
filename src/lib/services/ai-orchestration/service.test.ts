import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/prisma";
import { generateCardDraft } from "./service";

test("generateCardDraft rejects invalid structured AI output instead of returning a fallback card", async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.LLM_PROVIDER;
  const originalBaseUrl = process.env.LLM_BASE_URL;
  const originalApiKey = process.env.LLM_API_KEY;

  process.env.LLM_PROVIDER = "openai-compatible";
  process.env.LLM_BASE_URL = "https://llm.example.test";
  process.env.LLM_API_KEY = "test-key";
  const user = await prisma.user.create({
    data: {
      email: `invalid-ai-card-${Date.now()}@example.test`,
      passwordHash: "test"
    }
  });
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({
      choices: [{ message: { content: "not valid card json" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }) as typeof fetch;

  try {
    await assert.rejects(
      () => generateCardDraft({
        userId: user.id,
        content: "这是一段足够长的公众号正文。".repeat(20),
        templateId: "content_view",
        sourceType: "link",
        sourceTitle: "公众号文章"
      }),
      /AI_CARD_SCHEMA_INVALID/
    );
  } finally {
    globalThis.fetch = originalFetch;
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    restoreEnv("LLM_PROVIDER", originalProvider);
    restoreEnv("LLM_BASE_URL", originalBaseUrl);
    restoreEnv("LLM_API_KEY", originalApiKey);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
