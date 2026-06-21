import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("public entry introduces Atlora before registration", () => {
  const rootPage = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const publicHomePath = path.join(root, "src/components/public-home.tsx");

  assert.ok(existsSync(publicHomePath), "public home component should exist");
  const publicHome = readFileSync(publicHomePath, "utf8");
  assert.ok(rootPage.includes('redirect("/dashboard")'));
  assert.ok(rootPage.includes("<PublicHome />"));
  assert.ok(publicHome.includes('href="/register"'));
  assert.ok(publicHome.includes('href="/login"'));
});

test("public home uses the restrained spectral orbit accent system", () => {
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");

  assert.ok(publicHome.includes("bg-[#111111]"));
  assert.ok(publicHome.includes("#4f6f8f"));
  assert.ok(publicHome.includes("#b48745"));
  assert.ok(publicHome.includes("#9a554b"));
  assert.ok(publicHome.includes("capabilitySignals"));
  assert.ok(!publicHome.includes("bg-[#0b0f0d]"));
});

test("public home explains the material-to-card flow with language-neutral UI visuals", () => {
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");
  const flowVisualPath = path.join(root, "src/components/public-home-flow-visual.tsx");

  assert.ok(publicHome.includes("copy.publicHome.flow"));
  assert.ok(publicHome.includes("PublicHomeFlowVisual"));
  assert.ok(!publicHome.includes("next/image"));
  assert.ok(!publicHome.includes("/home-flow/"));
  assert.ok(!publicHome.includes("right-[12.5rem] top-[20.5rem]"));
  assert.ok(existsSync(flowVisualPath));

  const flowVisual = readFileSync(flowVisualPath, "utf8");
  for (const variant of ['"input"', '"extract"', '"card"']) {
    assert.ok(flowVisual.includes(variant));
  }
  assert.ok(flowVisual.includes('aria-hidden="true"'));
});

test("public home planets use accessible desktop-only orbit motion", () => {
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");
  const globalStyles = readFileSync(path.join(root, "src/app/globals.css"), "utf8");

  for (const className of ["orbit-motion--inner", "orbit-motion--middle", "orbit-motion--outer"]) {
    assert.ok(publicHome.includes(className));
  }
  assert.ok(globalStyles.includes("@keyframes orbit-spin"));
  assert.ok(globalStyles.includes("@media (min-width: 1024px)"));
  assert.ok(globalStyles.includes("prefers-reduced-motion: reduce"));
  assert.ok(globalStyles.includes(".orbit-motion"));
});

test("authentication pages share the dark Atlora frame", () => {
  for (const file of ["src/app/login/page.tsx", "src/app/register/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("AuthFrame"));
    assert.ok(!source.includes("bg-white"));
  }
});

test("authentication submits expose pending states", () => {
  for (const file of ["src/app/login/page.tsx", "src/app/register/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("isSubmitting"));
    assert.ok(source.includes("disabled={isSubmitting}"));
  }
});
