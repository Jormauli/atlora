import test from "node:test";
import assert from "node:assert/strict";
import { buildPostHogCapturePayload, safeAnalyticsProperties, domainFromUrl, isAnalyticsEnabled } from "./events";

test("analytics is disabled without a public PostHog key", () => {
  const previous = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  assert.equal(isAnalyticsEnabled(), false);
  if (previous) process.env.NEXT_PUBLIC_POSTHOG_KEY = previous;
});

test("safeAnalyticsProperties keeps only allowed metadata", () => {
  assert.deepEqual(
    safeAnalyticsProperties({
      sourceType: "link",
      templateId: "content_view",
      domain: "mp.weixin.qq.com",
      status: "failed",
      failureCode: "FETCH_FAILED",
      stage: "extracting",
      conceptSource: "user",
      rawUrl: "https://mp.weixin.qq.com/private",
      text: "private article",
      password: "secret"
    }),
    {
      sourceType: "link",
      templateId: "content_view",
      domain: "mp.weixin.qq.com",
      status: "failed",
      failureCode: "FETCH_FAILED",
      stage: "extracting",
      conceptSource: "user"
    }
  );
});

test("domainFromUrl returns host only", () => {
  assert.equal(domainFromUrl("https://mp.weixin.qq.com/s/private-path?token=secret"), "mp.weixin.qq.com");
  assert.equal(domainFromUrl("not a url"), undefined);
});

test("buildPostHogCapturePayload contains key event distinct id and safe properties only", () => {
  const payload = buildPostHogCapturePayload({
    apiKey: "phc_test",
    userId: "user-1",
    event: "knowledge_concept_added",
    properties: { conceptSource: "user", text: "private" }
  });
  assert.equal(payload.api_key, "phc_test");
  assert.equal(payload.event, "knowledge_concept_added");
  assert.equal(payload.distinct_id, "user-1");
  assert.deepEqual(payload.properties, { conceptSource: "user" });
});
