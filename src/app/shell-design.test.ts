import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("shared app shell uses the Atlora dark starfield surface", () => {
  const serverShell = readFileSync(path.join(root, "src/components/app-shell.tsx"), "utf8");
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  for (const source of [serverShell, clientShell]) {
    assert.ok(source.includes("starfield-surface"));
    assert.ok(source.includes("bg-[#101412]"));
    assert.ok(source.includes("Atlora"));
  }
});

test("secondary pages no longer use white cards as the main surface", () => {
  for (const file of ["src/app/new/page.tsx", "src/app/usage/page.tsx", "src/app/settings/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("border-[#354039]"));
    assert.ok(!source.includes("bg-white p-5"));
  }
});
