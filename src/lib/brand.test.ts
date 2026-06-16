import assert from "node:assert/strict";
import test from "node:test";
import { brand } from "./brand";

test("brand uses the Atlora knowledge starfield naming", () => {
  assert.equal(brand.name.zh, "知识星域");
  assert.equal(brand.name.en, "Atlora");
  assert.equal(brand.productLabel, "Atlora 知识星域");
  assert.equal(brand.navigation.library, "星域");
});
