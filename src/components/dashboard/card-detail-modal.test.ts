import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const modalSource = readFileSync(path.join(process.cwd(), "src/components/dashboard/card-detail-modal.tsx"), "utf8");

test("card detail modal locks page scroll while open", () => {
  assert.ok(modalSource.includes("document.body.style.overflow"));
  assert.ok(modalSource.includes("document.body.style.paddingRight"));
});

test("card detail modal contains wheel scrolling inside the card panel", () => {
  assert.ok(modalSource.includes("overscroll-contain"));
});

test("card detail modal deletes only after an inline confirmation", () => {
  assert.ok(modalSource.includes("confirmingDelete"));
  assert.ok(modalSource.includes("确认删除"));
  assert.ok(modalSource.includes("fetch(`/api/cards/${card.id}`"));
  assert.ok(modalSource.includes("method: \"DELETE\""));
});

test("card detail modal removes a deleted card without waiting for a route refresh", () => {
  assert.ok(modalSource.includes("onDelete"));
  assert.ok(modalSource.includes("onDelete(card.id)"));
  assert.ok(!modalSource.includes("router.refresh()"));
});

test("card detail modal language toggle changes interface labels instead of card content", () => {
  assert.ok(modalSource.includes("interfaceCopy"));
  assert.ok(modalSource.includes("Summary"));
  assert.ok(modalSource.includes("Key Points"));
  assert.ok(!modalSource.includes("getLocalizedCardContent"));
});
