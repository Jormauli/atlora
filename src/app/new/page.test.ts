import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const pageSource = readFileSync(path.join(process.cwd(), "src/app/new/page.tsx"), "utf8");

test("new material page shows loading stages for text image and link ingestion", () => {
  assert.ok(pageSource.includes("textStages"));
  assert.ok(pageSource.includes("imageStages"));
  assert.ok(pageSource.includes("linkStages"));
  assert.ok(pageSource.includes("LoadingProgress"));
});

test("new material page gives actionable recovery advice when ingestion fails", () => {
  assert.ok(pageSource.includes("errorAdvice"));
  assert.ok(pageSource.includes("链接打不开"));
  assert.ok(pageSource.includes("图片识别失败"));
  assert.ok(pageSource.includes("文本太短"));
});
