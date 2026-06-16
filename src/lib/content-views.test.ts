import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedContentViewLabels,
  contentViews,
  encodeSelectedContentViews,
  fallbackContentView,
  findContentView,
  parseSelectedContentViews
} from "./content-views";

test("content views include the onboarding choices and keep general content as fallback only", () => {
  assert.deepEqual(contentViews.map((view) => view.label), [
    "投资理财",
    "市场研究",
    "工具/技能",
    "个人成长",
    "新闻资讯",
    "知识点",
    "爆款好文"
  ]);
  assert.equal(fallbackContentView.label, "通用内容");
});

test("selected content views are encoded without duplicates or fallback values", () => {
  assert.equal(encodeSelectedContentViews(["investment_finance", "投资理财", "general_content", "unknown"]), "investment_finance");
});

test("selected content views parse from profile storage format", () => {
  assert.deepEqual(parseSelectedContentViews("investment_finance|market_research"), ["investment_finance", "market_research"]);
});

test("allowedContentViewLabels falls back to all onboarding views when profile has no selection", () => {
  assert.deepEqual(allowedContentViewLabels(null), contentViews.map((view) => view.label));
});

test("findContentView resolves legacy perspective and card type values", () => {
  assert.equal(findContentView("knowledge")?.label, "知识点");
  assert.equal(findContentView("market_research")?.sectionTitle, "商业情报提炼");
});
