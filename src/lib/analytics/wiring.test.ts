import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("auth routes capture registration and login events", () => {
  assert.ok(fs.readFileSync("src/app/api/auth/register/route.ts", "utf8").includes("user_registered"));
  assert.ok(fs.readFileSync("src/app/api/auth/login/route.ts", "utf8").includes("user_logged_in"));
});

test("ingestion routes capture safe material and link events", () => {
  const text = fs.readFileSync("src/app/api/ingestions/text/route.ts", "utf8");
  const image = fs.readFileSync("src/app/api/ingestions/image/route.ts", "utf8");
  const link = fs.readFileSync("src/app/api/ingestions/link/route.ts", "utf8");
  assert.ok(text.includes("material_submitted"));
  assert.ok(image.includes("material_submitted"));
  assert.ok(link.includes("material_submitted"));
  assert.ok(link.includes("link_ingestion_started"));
  assert.ok(link.includes("link_ingestion_failed"));
  assert.ok(link.includes("domainFromUrl"));
});

test("card save and concept routes capture card and manual concept events", () => {
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/route.ts", "utf8").includes("card_saved"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/save/route.ts", "utf8").includes("card_saved"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/concepts/route.ts", "utf8").includes("knowledge_concept_added"));
  assert.ok(fs.readFileSync("src/app/api/cards/[id]/concepts/[conceptId]/route.ts", "utf8").includes("knowledge_concept_removed"));
});
