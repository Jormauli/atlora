import assert from "node:assert/strict";
import test from "node:test";
import { linkIngestionSchema, textIngestionSchema } from "./ingestion";

test("ingestion validators accept generated content view template ids", () => {
  assert.equal(textIngestionSchema.parse({
    text: "一段文章正文",
    templateId: "content_view__market_research"
  }).templateId, "content_view__market_research");

  assert.equal(linkIngestionSchema.parse({
    url: "https://example.com/article",
    templateId: "content_view__tool_skill"
  }).templateId, "content_view__tool_skill");
});
