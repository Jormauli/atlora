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

test("dashboard recent observation titles allow two-line scanning", () => {
  assert.ok(source.includes("title={card.title}"));
  assert.ok(source.includes("line-clamp-2"));
  assert.ok(!source.includes("line-clamp-1 w-full rounded-md px-2 py-1.5 text-left text-xs"));
});

test("dashboard uses the open design spectral palette instead of the old green-dominant treatment", () => {
  assert.ok(source.includes("bg-[#111111]"));
  assert.ok(source.includes("border-[#2f2f2f]"));
  assert.ok(source.includes("#4f6f8f"));
  assert.ok(source.includes("#b48745"));
  assert.ok(source.includes("#9a554b"));
  assert.ok(!source.includes("bg-[#101412] text-[#f4f1e8]"));
  assert.ok(!source.includes("bg-[#d9e7c6] px-3 text-sm font-medium text-[#172018]"));
});

test("dashboard controls use stable centered alignment for bilingual labels", () => {
  assert.ok(source.includes("items-center justify-center"));
  assert.ok(source.includes("leading-none"));
  assert.ok(source.includes("min-w-0"));
  assert.ok(source.includes("truncate"));
  assert.ok(!source.includes("px-3 py-2 text-sm transition ${tab === item"));
});

test("dashboard exposes signed-in navigation on mobile when the desktop sidebar is hidden", () => {
  assert.ok(source.includes("DashboardMobileNav"));
  assert.ok(source.includes("lg:hidden"));
  assert.ok(source.includes('href="/usage"'));
  assert.ok(source.includes('href="/settings"'));
});

test("dashboard localizes view labels without changing filter ids", () => {
  const roleFilterSource = readFileSync(path.join(process.cwd(), "src/components/dashboard/role-filter-bar.tsx"), "utf8");
  assert.ok(roleFilterSource.includes("localizedContentViewLabel"));
  assert.ok(roleFilterSource.includes("onToggle(role.id)"));
  assert.ok(roleFilterSource.includes("roleToneClass"));
  assert.ok(roleFilterSource.includes("border-[#2f2f2f]"));
  assert.ok(roleFilterSource.includes("bg-[#171717]"));
  assert.ok(roleFilterSource.includes("items-center justify-center"));
  assert.ok(!roleFilterSource.includes("rounded-full border text-sm font-medium"));
});
