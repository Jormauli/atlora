import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("link ingestion returns an asynchronous ingestion id", async () => {
  const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  assert.match(source, /status:\s*202/);
  assert.match(source, /ingestionId/);
  assert.doesNotMatch(source, /ingestLink/);
  assert.doesNotMatch(source, /\{\s*card\s*\}/);
});
