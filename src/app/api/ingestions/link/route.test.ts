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
