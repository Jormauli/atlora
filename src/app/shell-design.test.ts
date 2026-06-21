import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("shared app shell uses the Atlora dark starfield surface", () => {
  const serverShell = readFileSync(path.join(root, "src/components/app-shell.tsx"), "utf8");
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  assert.ok(serverShell.includes("AppShellClient"));
  assert.ok(clientShell.includes("starfield-surface"));
  assert.ok(clientShell.includes("bg-[#101412]"));
  assert.ok(clientShell.includes("Atlora"));
});

test("secondary pages no longer use white cards as the main surface", () => {
  for (const file of ["src/app/new/page.tsx", "src/components/usage-content.tsx", "src/components/settings-content.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("border-[#354039]"));
    assert.ok(!source.includes("bg-white p-5"));
  }
});

test("card editing surfaces stay readable on the dark Atlora shell", () => {
  for (const file of ["src/components/card-editor.tsx", "src/app/cards/[id]/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("border-[#354039]"));
    assert.ok(!source.includes("bg-white"));
    assert.ok(!source.includes("bg-slate-50"));
  }
});
