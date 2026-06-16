import test from "node:test";
import assert from "node:assert/strict";
import { extractFirstUrl } from "./service";

test("extractFirstUrl finds the first http url in a WeChat message", () => {
  assert.equal(
    extractFirstUrl("这篇不错 https://mp.weixin.qq.com/s/example 可以整理一下"),
    "https://mp.weixin.qq.com/s/example"
  );
});

test("extractFirstUrl trims common Chinese punctuation after urls", () => {
  assert.equal(extractFirstUrl("链接：https://example.com/a/b，看看"), "https://example.com/a/b");
});

test("extractFirstUrl returns null when message has no url", () => {
  assert.equal(extractFirstUrl("只有一段普通文字"), null);
});
