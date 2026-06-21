import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const pageSource = readFileSync(path.join(process.cwd(), "src/app/new/page.tsx"), "utf8");

test("new material page shows loading stages for text image and link ingestion", () => {
  assert.ok(pageSource.includes("buildStageSets"));
  assert.ok(pageSource.includes("stageSets.text"));
  assert.ok(pageSource.includes("stageSets.image"));
  assert.ok(pageSource.includes("stageSets.link"));
  assert.ok(pageSource.includes("LoadingProgress"));
});

test("new material page gives actionable recovery advice when ingestion fails", () => {
  assert.ok(pageSource.includes("errorAdvice"));
  assert.ok(pageSource.includes("copy.newMaterial.advice[kind]"));
});
