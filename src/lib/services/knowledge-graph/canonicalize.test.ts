import test from "node:test";
import assert from "node:assert/strict";
import { findCanonicalMatch, normalizeEntityName } from "./canonicalize";

test("normalizeEntityName trims case and spacing differences", () => {
  assert.equal(normalizeEntityName("  AI   Agent "), "ai agent");
  assert.equal(normalizeEntityName("RAG"), "rag");
});

test("findCanonicalMatch matches canonical names and aliases", () => {
  const existing = [
    { id: "concept-1", name: "智能体", aliases: ["AI Agent", "Agent"] },
    { id: "concept-2", name: "RAG", aliases: ["Retrieval-Augmented Generation"] }
  ];

  assert.equal(findCanonicalMatch("ai agent", existing)?.id, "concept-1");
  assert.equal(findCanonicalMatch("Retrieval Augmented Generation", existing)?.id, undefined);
  assert.equal(findCanonicalMatch("Retrieval-Augmented Generation", existing)?.id, "concept-2");
});
