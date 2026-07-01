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

test("aiCardSchema accepts wrapped camelCase model output", () => {
  const parsed = aiCardSchema.parse({
    card: {
      title: "包裹输出",
      summary: "模型有时会把卡片放在 card 字段里。",
      keyPoints: ["观点：解析器应兼容常见包裹结构｜论据：response_format 只保证 JSON 对象"],
      rolePerspectives: ["【通用内容】通用信息卡：文章类型；阅读价值；我的收获"],
      actionItems: ["保留主卡片"],
      localizedContent: null,
      tags: ["#通用内容"],
      category: "通用内容",
      cardType: "general_content",
      perspective: "general_content",
      sourceTitle: "原文标题",
      sourceDomain: "mp.weixin.qq.com"
    }
  });

  assert.equal(parsed.title, "包裹输出");
  assert.deepEqual(parsed.key_points, ["观点：解析器应兼容常见包裹结构｜论据：response_format 只保证 JSON 对象"]);
  assert.deepEqual(parsed.role_perspectives, ["【通用内容】通用信息卡：文章类型；阅读价值；我的收获"]);
  assert.equal(parsed.card_type, "general_content");
  assert.equal(parsed.source_title, "原文标题");
});

test("aiCardSchema accepts array and named card wrappers", () => {
  const parsedFromArray = aiCardSchema.parse({
    cards: [{
      title: "数组包裹",
      summary: "模型有时会把卡片放在 cards 数组。",
      key_points: ["观点：取第一张卡片｜论据：当前接口只生成一张卡"],
      tags: ["#通用内容"]
    }]
  });
  const parsedFromNamedWrapper = aiCardSchema.parse({
    知识卡片: {
      标题: "命名包裹",
      摘要: "模型有时会使用中文对象名包裹卡片。",
      核心要点: ["观点：中文包裹也要解开｜论据：线上日志显示标题摘要仍缺失"],
      标签: ["#知识点"]
    }
  });

  assert.equal(parsedFromArray.title, "数组包裹");
  assert.equal(parsedFromNamedWrapper.title, "命名包裹");
  assert.deepEqual(parsedFromNamedWrapper.key_points, ["观点：中文包裹也要解开｜论据：线上日志显示标题摘要仍缺失"]);
});

test("aiCardSchema accepts common Chinese field names", () => {
  const parsed = aiCardSchema.parse({
    标题: "中文字段输出",
    摘要: "模型有时会使用中文字段名。",
    核心观点: ["观点：中文字段也要解析｜论据：中文模型可能翻译字段名"],
    视角提炼: ["【知识点】学习知识卡：核心概念；例子；复习问题"],
    行动项: ["生成主卡片"],
    标签: ["#知识点"],
    分类: "知识点",
    卡片类型: "knowledge",
    视角: "knowledge",
    原文标题: "中文原文标题",
    来源域名: "mp.weixin.qq.com"
  });

  assert.equal(parsed.title, "中文字段输出");
  assert.equal(parsed.summary, "模型有时会使用中文字段名。");
  assert.deepEqual(parsed.key_points, ["观点：中文字段也要解析｜论据：中文模型可能翻译字段名"]);
  assert.deepEqual(parsed.tags, ["#知识点"]);
  assert.equal(parsed.card_type, "knowledge");
});

test("aiCardSchema accepts knowledge concepts and concept relations", () => {
  const parsed = aiCardSchema.parse({
    title: "RAG 卡片",
    summary: "RAG 通过检索外部知识降低幻觉。",
    key_points: ["观点：RAG 降低幻觉｜论据：检索提供外部证据"],
    tags: ["AI 工具"],
    category: "工具/技能",
    card_type: "tool_skill",
    perspective: "tool_skill",
    knowledge_concepts: [
      {
        name: "RAG",
        aliases: ["Retrieval-Augmented Generation"],
        description: "结合检索与生成的知识增强方法",
        relevance: "high",
        evidence: "原文说明 RAG 使用外部检索降低幻觉"
      }
    ],
    concept_relations: [
      {
        source: "RAG",
        relation_type: "solves",
        target: "Hallucination",
        evidence: "原文指出 RAG 用外部证据降低错误回答",
        confidence: 0.82
      }
    ]
  });

  assert.equal(parsed.knowledge_concepts[0].name, "RAG");
  assert.deepEqual(parsed.knowledge_concepts[0].aliases, ["Retrieval-Augmented Generation"]);
  assert.equal(parsed.knowledge_concepts[0].relevance, "high");
  assert.equal(parsed.concept_relations[0].relation_type, "solves");
});

test("aiCardSchema keeps valid cards when graph candidates are imperfect", () => {
  const parsed = aiCardSchema.parse({
    title: "关系容错",
    summary: "图谱字段不能阻断主卡片生成。",
    key_points: ["观点：卡片生成优先于图谱增强"],
    tags: ["AI"],
    category: "摘要",
    card_type: "general_summary",
    perspective: "general",
    knowledge_concepts: [
      { name: "RAG", relevance: "very_high" },
      { aliases: ["缺少名称"] },
      "不是对象"
    ],
    concept_relations: [
      { source: "RAG", relation_type: "invented_relation", target: "Agent", confidence: "0.8" },
      { source: "RAG", relation_type: "solves" }
    ]
  });

  assert.equal(parsed.knowledge_concepts.length, 1);
  assert.equal(parsed.knowledge_concepts[0].name, "RAG");
  assert.equal(parsed.knowledge_concepts[0].relevance, "medium");
  assert.equal(parsed.concept_relations.length, 1);
  assert.equal(parsed.concept_relations[0].relation_type, "related_to");
  assert.equal(parsed.concept_relations[0].confidence, 0.8);
});
