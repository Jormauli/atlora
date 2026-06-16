import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCardFilters,
  filterDashboardCards,
  filterRolePerspectives,
  parseKeyPoint,
  roleLabelFromPerspective
} from "./card-view-model";
import type { DashboardCard } from "./card-view-model";

const cards: DashboardCard[] = [
  {
    id: "card-1",
    title: "AI 开店工具",
    summary: "总结",
    keyPoints: ["观点：适合一人公司｜论据：原文给出跨境店铺自动化案例"],
    rolePerspectives: [
      "【工具/技能】实操工具箱：推荐工具清单；可复用的方法/SOP；效率提升点。",
      "【市场研究】商业情报提炼：涉及领域；关键玩家；趋势信号。"
    ],
    tags: ["AI 工具", "跨境电商"],
    category: "工具应用",
    cardType: "tool_skill",
    perspective: "tool_skill",
    sourceType: "link",
    sourceUrl: "https://example.com",
    sourceTitle: "原文标题",
    sourceDomain: "example.com",
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z"
  },
  {
    id: "card-2",
    title: "投资案例",
    summary: "总结",
    keyPoints: ["只有一句观点"],
    rolePerspectives: ["【投资理财】投资行动参考：市场机会；风险警示；可操作建议。"],
    tags: ["投资", "案例"],
    category: "投资信息",
    cardType: "investment_info",
    perspective: "investment",
    sourceType: "text",
    sourceUrl: null,
    sourceTitle: null,
    sourceDomain: null,
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z"
  }
];

const cardsWithSecondaryView: DashboardCard[] = [
  ...cards,
  {
    id: "card-3",
    title: "工具主视角但含知识提炼",
    summary: "总结",
    keyPoints: ["观点：工具流程｜论据：原文是工具教程"],
    rolePerspectives: [
      "【工具/技能】实操工具箱：推荐工具清单；可复用方法；效率提升点。",
      "【知识点】学习知识卡：核心概念；前置知识；复习问题。"
    ],
    tags: ["工具", "学习"],
    category: "工具/技能",
    cardType: "tool_skill",
    perspective: "tool_skill",
    sourceType: "link",
    sourceUrl: null,
    sourceTitle: null,
    sourceDomain: null,
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z"
  }
];

test("buildCardFilters derives role and tag options from saved cards", () => {
  const filters = buildCardFilters(cards);

  assert.deepEqual(filters.roles.map((role) => role.label), [
    "全部",
    "投资理财",
    "市场研究",
    "工具/技能",
    "个人成长",
    "新闻资讯",
    "知识点",
    "爆款好文",
    "通用内容"
  ]);
  assert.deepEqual(filters.tags, ["AI 工具", "跨境电商", "投资", "案例"]);
});

test("parseKeyPoint separates point and evidence when the prompt format is present", () => {
  assert.deepEqual(parseKeyPoint("观点：适合一人公司｜论据：原文给出跨境店铺自动化案例"), {
    point: "适合一人公司",
    evidence: "原文给出跨境店铺自动化案例"
  });
});

test("parseKeyPoint keeps legacy text readable when no evidence delimiter exists", () => {
  assert.deepEqual(parseKeyPoint("只有一句观点"), {
    point: "只有一句观点",
    evidence: ""
  });
});

test("parseKeyPoint separates English point and evidence", () => {
  assert.deepEqual(parseKeyPoint("Point: Agents orchestrate store setup. | Evidence: The article lists research, supplier screening, and Shopify setup."), {
    point: "Agents orchestrate store setup.",
    evidence: "The article lists research, supplier screening, and Shopify setup."
  });
});

test("roleLabelFromPerspective maps known templates to product labels", () => {
  assert.equal(roleLabelFromPerspective("knowledge", "knowledge"), "知识点");
  assert.equal(roleLabelFromPerspective("investment", "investment_info"), "投资理财");
  assert.equal(roleLabelFromPerspective("unknown", "tool_app"), "工具/技能");
});

test("filterRolePerspectives returns all sections when all views are selected", () => {
  const perspectives = [
    "【工具/技能】实操工具箱：关注分享触发。",
    "【市场研究】商业情报提炼：先验证单店闭环。"
  ];

  assert.deepEqual(filterRolePerspectives(perspectives, ["all"]), perspectives);
});

test("filterRolePerspectives keeps sections for selected views only", () => {
  const perspectives = [
    "【工具/技能】实操工具箱：关注分享触发。",
    "【市场研究】商业情报提炼：先验证供应链。",
    "【投资理财】投资行动参考：关注现金流质量。"
  ];

  assert.deepEqual(filterRolePerspectives(perspectives, ["市场研究", "工具/技能"]), [
    "【工具/技能】实操工具箱：关注分享触发。",
    "【市场研究】商业情报提炼：先验证供应链。"
  ]);
});

test("filterRolePerspectives maps legacy unmatched roles to general content", () => {
  const perspectives = [
    "对创业者的启示：先验证单店闭环。",
    "工具/技能：关注分享触发。"
  ];

  assert.deepEqual(filterRolePerspectives(perspectives, ["通用内容"]), [
    "对创业者的启示：先验证单店闭环。"
  ]);
  assert.deepEqual(filterRolePerspectives(perspectives, ["工具/技能"]), [
    "工具/技能：关注分享触发。"
  ]);
});

test("filterDashboardCards applies role, tag, query, and sort rules", () => {
  const filtered = filterDashboardCards(cards, {
    query: "原文标题",
    selectedRoleIds: ["工具/技能"],
    activeTag: "AI 工具",
    sort: "desc"
  });

  assert.deepEqual(filtered.map((card) => card.id), ["card-1"]);
});

test("filterDashboardCards filters by primary card view rather than secondary insight sections", () => {
  const filtered = filterDashboardCards(cardsWithSecondaryView, {
    query: "",
    selectedRoleIds: ["知识点"],
    activeTag: "",
    sort: "desc"
  });

  assert.deepEqual(filtered.map((card) => card.id), []);
});

test("filterDashboardCards sorts ascending when requested", () => {
  const filtered = filterDashboardCards(cards, {
    query: "",
    selectedRoleIds: ["all"],
    activeTag: "",
    sort: "asc"
  });

  assert.deepEqual(filtered.map((card) => card.id), ["card-2", "card-1"]);
});
