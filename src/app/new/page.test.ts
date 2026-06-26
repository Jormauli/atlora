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

test("link ingestion polls real backend stages and survives refresh", () => {
  assert.ok(pageSource.includes("/api/ingestions/${ingestionId}"));
  assert.ok(pageSource.includes("searchParams.set(\"ingestion\""));
  assert.ok(pageSource.includes("LinkIngestionProgress"));
  assert.ok(pageSource.includes("generating_card"));
});

test("link ingestion uses submit event state updates so progress renders before fetch completes", () => {
  assert.ok(pageSource.includes("async function submitLink(event: React.FormEvent<HTMLFormElement>)"));
  assert.ok(pageSource.includes("event.preventDefault()"));
  assert.ok(pageSource.includes("<form onSubmit={submitLink}"));
});
