import test from "node:test";
import assert from "node:assert/strict";
import { aiCardSchema } from "./card";

test("aiCardSchema normalizes object and string list fields", () => {
  const parsed = aiCardSchema.parse({
    title: "连接型卡片",
    summary: "把输入整理成可连接、可复用的知识卡片。",
    key_points: [{ fact: "事实", view: "观点" }, "第二点"],
    critical_evidence: "待验证：单条证据",
    tags: [{ name: "知识管理" }],
    category: "摘要",
    card_type: "general_summary",
    perspective: "connection"
  });

  assert.deepEqual(parsed.key_points, ["事实：观点", "第二点"]);
  assert.deepEqual(parsed.critical_evidence, ["待验证：单条证据"]);
  assert.deepEqual(parsed.tags, ["知识管理"]);
  assert.deepEqual(parsed.framework_structure, []);
});

test("aiCardSchema normalizes localized English content", () => {
  const parsed = aiCardSchema.parse({
    title: "中文标题",
    summary: "中文总结",
    key_points: ["观点：中文｜论据：中文"],
    tags: ["#市场研究"],
    category: "市场研究",
    card_type: "market_research",
    perspective: "market_research",
    localized_content: {
      en: {
        title: "English Title",
        summary: "English summary",
        key_points: ["Point: English. | Evidence: Source."],
        role_perspectives: ["[Market Research] Business intelligence."],
        tags: ["#MarketResearch"],
        category: "Market Research",
        source_title: "Original English Title"
      }
    }
  });

  assert.equal(parsed.localized_content?.en?.title, "English Title");
  assert.deepEqual(parsed.localized_content?.en?.keyPoints, ["Point: English. | Evidence: Source."]);
  assert.deepEqual(parsed.localized_content?.en?.rolePerspectives, ["[Market Research] Business intelligence."]);
  assert.equal(parsed.localized_content?.en?.sourceTitle, "Original English Title");
});
