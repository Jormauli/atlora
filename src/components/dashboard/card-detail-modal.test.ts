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

test("card detail modal recalculates panel geometry when the viewport changes", () => {
  assert.ok(modalSource.includes("viewportSize"));
  assert.ok(modalSource.includes("window.addEventListener(\"resize\", updateViewportSize)"));
  assert.ok(modalSource.includes("window.removeEventListener(\"resize\", updateViewportSize)"));
  assert.ok(modalSource.includes("width: window.innerWidth"));
  assert.ok(modalSource.includes("height: window.innerHeight"));
});

test("card detail modal deletes only after an inline confirmation", () => {
  assert.ok(modalSource.includes("confirmingDelete"));
  assert.ok(modalSource.includes("cardCopy.confirmDelete"));
  assert.ok(modalSource.includes("fetch(`/api/cards/${card.id}`"));
  assert.ok(modalSource.includes("method: \"DELETE\""));
});

test("card detail modal removes a deleted card without waiting for a route refresh", () => {
  assert.ok(modalSource.includes("onDelete"));
  assert.ok(modalSource.includes("onDelete(card.id)"));
  assert.ok(!modalSource.includes("router.refresh()"));
});

test("card detail modal uses the global language state for interface labels only", () => {
  assert.ok(modalSource.includes("useLanguage"));
  assert.ok(modalSource.includes("copy.card"));
  assert.ok(!modalSource.includes("useState<\"zh\" | \"en\">"));
  assert.ok(!modalSource.includes("getLocalizedCardContent"));
});

test("card detail modal follows the neutral open design reader surface", () => {
  assert.ok(modalSource.includes("bg-[#171717]"));
  assert.ok(modalSource.includes("border-[#2f2f2f]"));
  assert.ok(modalSource.includes("#4f6f8f"));
  assert.ok(modalSource.includes("#b48745"));
  assert.ok(modalSource.includes("#9a554b"));
  assert.ok(modalSource.includes("items-center justify-center"));
  assert.ok(!modalSource.includes("bg-[#171d1a]"));
  assert.ok(!modalSource.includes("bg-[#d9e7c6] px-5 py-2 text-sm font-medium text-[#172018]"));
});
