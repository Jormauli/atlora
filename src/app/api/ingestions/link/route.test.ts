import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("WeChat ingestion returns an asynchronous id while normal links keep existing behavior", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  assert.match(source, /status:\s*202/);
  assert.match(source, /ingestionId/);
  assert.match(source, /isWeChatArticleUrl/);
  assert.match(source, /ingestLink/);
  assert.match(source, /enqueueWeChat/);
});

test("WeChat ingestion is gated by WECHAT_INGESTION_ENABLED feature flag", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  assert.match(source, /WECHAT_INGESTION_ENABLED/);
});

test("WeChat async ingestion returns an ingestion id for progress polling", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const wechatBranch = source.slice(source.indexOf("const templateId = resolveTemplate"));
  assert.doesNotMatch(wechatBranch, /return NextResponse\.json\(\{\s*card\s*\}\);/);
  assert.match(wechatBranch, /return NextResponse\.json\(\{\s*ingestionId:\s*ingestion\.id\s*\}/);
});

test("WeChat ingestion tries fast HTML extraction before falling back to the worker", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  assert.match(source, /export const maxDuration = 60/);
  assert.match(source, /tryHtmlExtraction/);
  assert.match(source, /enqueueExtracted/);
  assert.match(source, /enqueueWeChat/);
});

test("WeChat ingestion does not return a direct card from the user request", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const wechatBranch = source.slice(source.indexOf("const templateId = resolveTemplate"));
  assert.doesNotMatch(wechatBranch, /return NextResponse\.json\(\{\s*card\s*\}\);/);
  assert.doesNotMatch(source, /createDraftCard/);
  assert.doesNotMatch(source, /completeWorkerExtraction/);
});
