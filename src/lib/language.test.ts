import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("language copy supports global Chinese and English UI labels", async () => {
  const { localizedContentViewLabel, uiCopy } = await import("./language");

  assert.equal(uiCopy.zh.navigation.library, "星域");
  assert.equal(uiCopy.en.navigation.library, "Starfield");
  assert.equal(uiCopy.zh.card.close, "关闭卡片");
  assert.equal(uiCopy.en.card.close, "Close Card");
  assert.equal(uiCopy.zh.publicHome.primaryAction, "开始体验");
  assert.equal(uiCopy.en.publicHome.primaryAction, "Start Exploring");
  assert.equal(uiCopy.zh.auth.registering, "注册中...");
  assert.equal(uiCopy.en.auth.loggingIn, "Logging in...");
  assert.equal(uiCopy.zh.publicHome.flow.steps.length, 3);
  assert.equal(uiCopy.en.publicHome.flow.steps.length, 3);
  assert.equal(localizedContentViewLabel("investment_finance", uiCopy.zh), "投资理财");
  assert.equal(localizedContentViewLabel("投资理财", uiCopy.en), "Investing");
  assert.equal(localizedContentViewLabel("综合摘要", uiCopy.en), "General");
  assert.equal(localizedContentViewLabel("custom-view", uiCopy.en), "custom-view");
});

test("app shells expose the shared global language switcher", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  const serverShell = readFileSync(path.join(root, "src/components/app-shell.tsx"), "utf8");
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  assert.ok(layout.includes("LanguageProvider"));
  assert.ok(serverShell.includes("AppShellClient"));
  assert.ok(clientShell.includes("LanguageToggle"));
});

test("global language changes also update the document language", () => {
  const provider = readFileSync(path.join(root, "src/components/language-provider.tsx"), "utf8");

  assert.ok(provider.includes('document.documentElement.lang = nextLanguage === "en" ? "en" : "zh-CN"'));
});
