import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("failed worker callbacks never invoke card generation", async () => {
  const source = await readFile(
    path.join(process.cwd(), "src/app/api/internal/ingestions/[id]/failed/route.ts"),
    "utf8"
  );
  assert.match(source, /failWorkerIngestion/);
  assert.doesNotMatch(source, /completeWorkerExtraction|generateCardDraft|createDraftCard/);
});

test("extracted callbacks are claimed atomically before card generation", async () => {
  const source = await readFile(
    path.join(process.cwd(), "src/lib/services/ingestion/async-service.ts"),
    "utf8"
  );
  assert.match(source, /\$transaction/);
  assert.match(source, /stage:\s*\{\s*in:\s*\["queued",\s*"opening_article",\s*"extracting_text",\s*"recognizing_text"\]/);
  assert.match(source, /ingestionItemId:\s*ingestionId/);
});
