import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import robots from "./robots";
import sitemap from "./sitemap";

test("sitemap publishes only localized public pages", () => {
  assert.deepEqual(sitemap().map((entry) => entry.url), [
    "https://www.atlora.io/zh",
    "https://www.atlora.io/en"
  ]);
  assert.ok(sitemap().every((entry) => entry.changeFrequency === "weekly" && entry.priority === 1));
});

test("robots points to the production sitemap and leaves private HTML crawlable for noindex", () => {
  const value = robots();
  const rules = Array.isArray(value.rules) ? value.rules : [value.rules];
  const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

  assert.equal(value.sitemap, "https://www.atlora.io/sitemap.xml");
  assert.equal(value.host, "https://www.atlora.io");
  assert.ok(disallowed.includes("/api/"));
  assert.equal(disallowed.includes("/dashboard"), false);
  assert.equal(disallowed.includes("/login"), false);
});

test("social preview uses standard Open Graph dimensions and Atlora branding", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/opengraph-image.tsx"), "utf8");

  assert.ok(source.includes("width: 1200"));
  assert.ok(source.includes("height: 630"));
  assert.ok(source.includes("Atlora"));
  assert.ok(source.includes("Knowledge Starfield"));
  assert.ok(source.includes("AI Article Summarizer"));
  assert.ok(source.includes("ImageResponse"));
});
