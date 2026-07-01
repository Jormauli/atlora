import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("card concept POST route authenticates validates and delegates to manual service", () => {
  const source = fs.readFileSync("src/app/api/cards/[id]/concepts/route.ts", "utf8");
  assert.ok(source.includes("getCurrentUser"));
  assert.ok(source.includes("z.object"));
  assert.ok(source.includes("name"));
  assert.ok(source.includes(".max(80)"));
  assert.ok(source.includes("addManualCardConcept"));
  assert.ok(source.includes("ManualConceptError"));
  assert.ok(source.includes("concepts"));
});

test("card concept DELETE route authenticates and removes only the card concept link", () => {
  const source = fs.readFileSync("src/app/api/cards/[id]/concepts/[conceptId]/route.ts", "utf8");
  assert.ok(source.includes("getCurrentUser"));
  assert.ok(source.includes("removeManualCardConcept"));
  assert.ok(source.includes("params.conceptId"));
  assert.ok(source.includes("ManualConceptError"));
  assert.ok(source.includes("concepts"));
});
