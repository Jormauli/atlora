import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("generates Prisma Client after dependency installation", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(packageJson.scripts?.postinstall, "prisma generate");
});
