import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const editorSource = readFileSync(path.join(process.cwd(), "src/components/card-editor.tsx"), "utf8");
const cardPageSource = readFileSync(path.join(process.cwd(), "src/app/cards/[id]/page.tsx"), "utf8");
const draftPageSource = readFileSync(path.join(process.cwd(), "src/app/cards/[id]/draft/page.tsx"), "utf8");

test("card editor displays persisted knowledge concepts", () => {
  assert.ok(editorSource.includes("copy.card.knowledgeConcepts"));
  assert.ok(editorSource.includes("card.knowledgeConcepts"));
  assert.ok(editorSource.includes("concept.name"));
});

test("card detail pages load and serialize knowledge concepts", () => {
  for (const source of [cardPageSource, draftPageSource]) {
    assert.ok(source.includes("cardConcepts"));
    assert.ok(source.includes("knowledgeConcepts"));
    assert.ok(source.includes("canonicalName"));
  }
});
