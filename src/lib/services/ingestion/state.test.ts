import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionIngestionStage } from "./state";

test("ingestion stages only move through valid processing transitions", () => {
  assert.equal(canTransitionIngestionStage("queued", "opening_article"), true);
  assert.equal(canTransitionIngestionStage("opening_article", "extracting_text"), true);
  assert.equal(canTransitionIngestionStage("extracting_text", "capturing_screenshot"), true);
  assert.equal(canTransitionIngestionStage("capturing_screenshot", "recognizing_text"), true);
  assert.equal(canTransitionIngestionStage("extracting_text", "generating_card"), true);
  assert.equal(canTransitionIngestionStage("recognizing_text", "generating_card"), true);
  assert.equal(canTransitionIngestionStage("generating_card", "completed"), true);
});

test("ingestion stages reject backward and invalid transitions", () => {
  assert.equal(canTransitionIngestionStage("queued", "completed"), false);
  assert.equal(canTransitionIngestionStage("recognizing_text", "opening_article"), false);
  assert.equal(canTransitionIngestionStage("completed", "generating_card"), false);
  assert.equal(canTransitionIngestionStage("failed", "queued"), false);
});

test("active stages can fail and repeated callbacks are idempotent", () => {
  assert.equal(canTransitionIngestionStage("opening_article", "failed"), true);
  assert.equal(canTransitionIngestionStage("generating_card", "failed"), true);
  assert.equal(canTransitionIngestionStage("extracting_text", "extracting_text"), true);
  assert.equal(canTransitionIngestionStage("completed", "completed"), true);
});
