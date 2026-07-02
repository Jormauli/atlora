import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("shared app shell uses the open design neutral spectral surface", () => {
  const serverShell = readFileSync(path.join(root, "src/components/app-shell.tsx"), "utf8");
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  assert.ok(serverShell.includes("AppShellClient"));
  assert.ok(clientShell.includes("spectral-surface"));
  assert.ok(clientShell.includes("bg-[#111111]"));
  assert.ok(clientShell.includes("border-[#2f2f2f]"));
  assert.ok(clientShell.includes("Atlora"));
  assert.ok(!clientShell.includes("starfield-surface"));
  assert.ok(!clientShell.includes("bg-[#101412]"));
});

test("shared app shell prevents mobile horizontal page overflow", () => {
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  assert.ok(clientShell.includes("overflow-x-hidden"));
  assert.ok(clientShell.includes("flex-col"));
  assert.ok(clientShell.includes("sm:flex-row"));
  assert.ok(clientShell.includes("w-full min-w-0 flex-wrap"));
  assert.ok(clientShell.includes("max-w-[7rem] truncate"));
});

test("secondary pages no longer use white cards as the main surface", () => {
  for (const file of ["src/app/new/page.tsx", "src/components/usage-content.tsx", "src/components/settings-content.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("border-[#2f2f2f]"));
    assert.ok(source.includes("bg-[#171717]"));
    assert.ok(!source.includes("border-[#354039]"));
    assert.ok(!source.includes("bg-white p-5"));
  }
});

test("settings summary cards wait for a wide content column before splitting", () => {
  const source = readFileSync(path.join(root, "src/components/settings-content.tsx"), "utf8");

  assert.ok(source.includes("lg:grid-cols-2"));
  assert.ok(!source.includes("md:grid-cols-2"));
});

test("card editing surfaces stay readable on the dark Atlora shell", () => {
  for (const file of ["src/components/card-editor.tsx", "src/app/cards/[id]/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("border-[#354039]"));
    assert.ok(!source.includes("bg-white"));
    assert.ok(!source.includes("bg-slate-50"));
  }
});

test("card detail layout cannot be widened by long mobile content", () => {
  const cardPage = readFileSync(path.join(root, "src/app/cards/[id]/page.tsx"), "utf8");
  const editorSource = readFileSync(path.join(root, "src/components/card-editor.tsx"), "utf8");

  assert.ok(cardPage.includes("min-w-0"));
  assert.ok(cardPage.includes("break-words"));
  assert.ok(editorSource.includes("min-w-0"));
  assert.ok(editorSource.includes("flex-wrap"));
});
