import test from "node:test";
import assert from "node:assert/strict";
import { isUsableOCRText, resolveTemplate } from "./service";

test("resolveTemplate keeps explicit template choices", () => {
  assert.equal(resolveTemplate("tool_app", "内容创作者"), "tool_app");
});

test("resolveTemplate maps profile defaults for auto mode", () => {
  assert.equal(resolveTemplate("auto", "investment_finance|market_research"), "content_view__investment_finance,market_research");
  assert.equal(resolveTemplate("auto", "knowledge"), "content_view__knowledge");
});

test("resolveTemplate falls back to general summary", () => {
  assert.equal(resolveTemplate("auto"), "content_view");
  assert.equal(resolveTemplate("auto", "未知"), "content_view");
});

test("isUsableOCRText rejects short or low-confidence OCR noise", () => {
  assert.equal(isUsableOCRText("86", 0.68), false);
  assert.equal(isUsableOCRText("这是一段足够长的截图识别文本，用于生成知识卡片。", 0.2), false);
  assert.equal(isUsableOCRText("这是一段足够长的截图识别文本，用于生成知识卡片。", 0.9), true);
});
