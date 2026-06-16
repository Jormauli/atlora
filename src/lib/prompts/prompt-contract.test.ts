import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const promptDir = path.join(process.cwd(), "src/lib/prompts");
const promptFiles = readdirSync(promptDir).filter((file) => file.endsWith(".zh.md"));

test("Chinese card prompts use the concise information-card contract", () => {
  for (const file of promptFiles) {
    const prompt = readFileSync(path.join(promptDir, file), "utf8");

    assert.ok(prompt.includes("让没看过原文的人"));
    assert.ok(prompt.includes("核心观点+论据") || prompt.includes("观点/信息点和原文论据"));
    assert.ok(prompt.includes("role_perspectives"));
    assert.ok(prompt.includes("原文链接"));
    assert.ok(!prompt.includes("不超过 60 字"));
    assert.ok(!prompt.includes("framework_structure"));
    assert.ok(!prompt.includes("critical_evidence"));
    assert.ok(!prompt.includes("used_models"));
    assert.ok(!prompt.includes("connections"));
  }
});

test("content view prompt keeps knowledge academic and general content as article fallback", () => {
  const prompt = readFileSync(path.join(promptDir, "content_view.zh.md"), "utf8");

  assert.ok(prompt.includes("知识点不是普通文章、观点文章、新闻评论或爆款拆解的默认分类"));
  assert.ok(prompt.includes("普通文章、观点评论、故事叙事、情感共鸣或无法归入用户所选视角的内容"));
});

test("content view prompt does not translate card content into a second language", () => {
  const prompt = readFileSync(path.join(promptDir, "content_view.zh.md"), "utf8");

  assert.ok(!prompt.includes("localized_content"));
  assert.ok(!prompt.includes("英文版"));
});
