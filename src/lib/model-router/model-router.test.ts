import test from "node:test";
import assert from "node:assert/strict";
import { routeModel } from "./index";

test("card generation leaves enough output budget for graph-enriched JSON", () => {
  const route = routeModel({
    taskType: "card_generation",
    contentLength: 4000,
    sourceType: "link",
    templateId: "content_view__investment_finance,market_research,tool_skill"
  });

  assert.equal(route.tier, "medium");
  assert.ok(route.maxOutputTokens >= 3200);
});

test("json repair has enough output budget to repair truncated card JSON", () => {
  const route = routeModel({
    taskType: "json_repair",
    contentLength: 1800,
    sourceType: "link"
  });

  assert.equal(route.tier, "small");
  assert.ok(route.maxOutputTokens >= 2000);
});
