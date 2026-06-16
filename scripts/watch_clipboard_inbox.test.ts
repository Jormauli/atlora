import test from "node:test";
import assert from "node:assert/strict";
import { shouldForwardClipboardText } from "./watch_clipboard_inbox";

test("shouldForwardClipboardText accepts urls", () => {
  assert.equal(shouldForwardClipboardText("https://mp.weixin.qq.com/s/example", ""), true);
});

test("shouldForwardClipboardText accepts meaningful Chinese text", () => {
  assert.equal(shouldForwardClipboardText("这是一条微信素材测试", ""), true);
});

test("shouldForwardClipboardText rejects duplicates and noise", () => {
  assert.equal(shouldForwardClipboardText("这是一条微信素材测试", "这是一条微信素材测试"), false);
  assert.equal(shouldForwardClipboardText("abc123", ""), false);
});
