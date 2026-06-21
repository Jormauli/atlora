import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { brand } from "./brand";

test("brand uses the Atlora knowledge starfield naming", () => {
  assert.equal(brand.name.zh, "知识星域");
  assert.equal(brand.name.en, "Atlora");
  assert.equal(brand.productLabel, "Atlora 知识星域");
  assert.equal(brand.navigation.library, "星域");
});

test("brand surfaces use the shared Stellar Core mark", () => {
  const root = process.cwd();
  const markPath = path.join(root, "src/components/brand-mark.tsx");
  assert.ok(existsSync(markPath));

  const mark = readFileSync(markPath, "utf8");
  for (const color of ["#4f6f8f", "#b48745", "#9a554b"]) assert.ok(mark.includes(color));

  for (const file of [
    "src/components/public-home.tsx",
    "src/components/auth-frame.tsx",
    "src/components/app-shell-client.tsx",
    "src/components/dashboard-workspace.tsx"
  ]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("BrandMark"), `${file} should use BrandMark`);
  }
});
