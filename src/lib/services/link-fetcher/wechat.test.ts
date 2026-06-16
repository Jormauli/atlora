import test from "node:test";
import assert from "node:assert/strict";
import {
  firstNonEmptyLine,
  isWeChatArticleUrl,
  looksLikeUsableArticleText,
  parsePositiveInteger,
  parseMarkdown
} from "./wechat";

test("isWeChatArticleUrl accepts official account article links only", () => {
  assert.equal(isWeChatArticleUrl("https://mp.weixin.qq.com/s/example"), true);
  assert.equal(isWeChatArticleUrl("https://example.com/s/example"), false);
  assert.equal(isWeChatArticleUrl("not-a-url"), false);
});

test("parseMarkdown removes frontmatter, heading, images, and links", () => {
  const parsed = parseMarkdown(`---
title: demo
---
# 标题

这里有一段[正文](https://example.com)。

![配图](https://example.com/image.png)
`);

  assert.deepEqual(parsed, {
    title: "标题",
    text: "这里有一段正文。"
  });
});

test("firstNonEmptyLine returns the first meaningful OCR line", () => {
  assert.equal(firstNonEmptyLine("\n \n 第一行\n第二行"), "第一行");
});

test("looksLikeUsableArticleText requires enough mostly-Chinese content", () => {
  assert.equal(looksLikeUsableArticleText("太短"), false);
  assert.equal(looksLikeUsableArticleText("x".repeat(160)), false);
  assert.equal(looksLikeUsableArticleText("这是一段用于测试的中文正文。".repeat(12)), true);
});

test("parsePositiveInteger falls back for invalid retry settings", () => {
  assert.equal(parsePositiveInteger("3", 2), 3);
  assert.equal(parsePositiveInteger("0", 2), 2);
  assert.equal(parsePositiveInteger("bad", 2), 2);
  assert.equal(parsePositiveInteger(undefined, 2), 2);
});
