import test from "node:test";
import assert from "node:assert/strict";
import { extractLikelyMessage } from "./watch_wechat_file_transfer";

test("extractLikelyMessage prefers urls from OCR text", () => {
  assert.equal(
    extractLikelyMessage("微信\n文件传输助手\nhttps://mp.weixin.qq.com/s/example\n"),
    "https://mp.weixin.qq.com/s/example"
  );
});

test("extractLikelyMessage falls back to the latest useful text line", () => {
  assert.equal(
    extractLikelyMessage("微信\n文件传输助手\n这是一条需要生成卡片的微信消息\n"),
    "这是一条需要生成卡片的微信消息"
  );
});
