import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const source = readFileSync(path.join(process.cwd(), "src/components/dashboard-workspace.tsx"), "utf8");

test("dashboard view filter is single-select to avoid mixed view results", () => {
  assert.ok(source.includes("setSelectedRoles([roleId])"));
  assert.ok(!source.includes("withoutAll.includes(roleId)"));
});

test("dashboard removes deleted cards from local state immediately", () => {
  assert.ok(source.includes("useState(cards)"));
  assert.ok(source.includes("setVisibleCards"));
  assert.ok(source.includes("filter((card) => card.id !== cardId)"));
  assert.ok(source.includes("onDelete={removeCardFromView}"));
});

test("dashboard exposes the global language switcher", () => {
  assert.ok(source.includes("LanguageToggle"));
  assert.ok(source.includes("useLanguage"));
});

test("dashboard localizes view labels without changing filter ids", () => {
  const roleFilterSource = readFileSync(path.join(process.cwd(), "src/components/dashboard/role-filter-bar.tsx"), "utf8");
  assert.ok(roleFilterSource.includes("localizedContentViewLabel"));
  assert.ok(roleFilterSource.includes("onToggle(role.id)"));
});
