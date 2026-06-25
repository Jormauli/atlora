import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("internal wechat-test route verifies HMAC and enqueues a worker task", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  assert.match(source, /verifyWorkerRequest/);
  assert.match(source, /enqueueWeChat/);
  assert.match(source, /isWeChatArticleUrl/);
  assert.match(source, /WORKER_CALLBACK_SECRET/);
  assert.match(source, /status:\s*202/);
  assert.doesNotMatch(source, /export\s+const\s+WECHAT_TEST_SIGNATURE_ID/);
});
