import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("public entry redirects authenticated users to the dashboard and unauthenticated users to zh", () => {
  const rootPage = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");

  assert.ok(rootPage.includes('redirect("/dashboard")'));
  assert.ok(rootPage.includes('redirect("/zh")'));
  assert.ok(!rootPage.includes("<PublicHome"));
});

test("localized public entry validates locale, exports static params, and emits localized metadata", async () => {
  const pageModule = await import("./[locale]/page");

  assert.deepEqual(await pageModule.generateStaticParams(), [{ locale: "zh" }, { locale: "en" }]);

  const zhMetadata = await pageModule.generateMetadata({ params: { locale: "zh" } });
  const enMetadata = await pageModule.generateMetadata({ params: { locale: "en" } });
  const invalidMetadata = await pageModule.generateMetadata({ params: { locale: "fr" } });

  assert.equal(zhMetadata.title, "AI 文章总结与知识卡片工具 | Atlora 知识星域");
  assert.equal(enMetadata.title, "AI Article Summarizer & Knowledge Card Generator | Atlora");
  assert.notDeepEqual(zhMetadata, enMetadata);
  assert.deepEqual(invalidMetadata, {});

  const localePage = readFileSync(path.join(root, "src/app/[locale]/page.tsx"), "utf8");
  assert.ok(localePage.includes('isSeoLocale(params.locale)'));
  assert.ok(localePage.includes('notFound()'));
  assert.ok(localePage.includes('redirect("/dashboard")'));
  assert.ok(localePage.includes('<PublicHome locale={locale} />'));
  assert.ok(localePage.includes('type="application/ld+json"'));
  assert.ok(localePage.includes('\\u003c'));
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

test("public home uses the localized route copy and localized home link", () => {
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");

  assert.ok(publicHome.includes("export function PublicHome({ locale }: { locale: SeoLocale })"));
  assert.ok(publicHome.includes("uiCopy[locale]"));
  assert.ok(publicHome.includes("LocaleLanguageToggle"));
  assert.ok(publicHome.includes('href={`/${locale}`}'));
  assert.ok(publicHome.includes('href="/register"'));
  assert.ok(publicHome.includes('href="/login"'));
  assert.ok(publicHome.includes("setLanguage(locale)"));
  assert.ok(publicHome.includes('document.documentElement.lang = locale === "en" ? "en" : "zh-CN"'));
  assert.ok(!publicHome.includes("useRef"));
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

test("language provider accepts an initial language and exposes crawlable locale toggles", () => {
  const languageProvider = readFileSync(path.join(root, "src/components/language-provider.tsx"), "utf8");

  assert.ok(languageProvider.includes("initialLanguage?: UiLanguage"));
  assert.ok(languageProvider.includes("useCallback"));
  assert.ok(languageProvider.includes("useState<UiLanguage>(() => initialLanguage ?? \"zh\")"));
  assert.ok(languageProvider.includes("if (initialLanguage !== undefined)"));
  assert.ok(languageProvider.includes("window.localStorage.setItem(storageKey, nextLanguage)"));
  assert.ok(languageProvider.includes('Path=/; Max-Age=31536000; SameSite=Lax'));
  assert.ok(languageProvider.includes("export function LocaleLanguageToggle"));
  assert.ok(languageProvider.includes('href="/zh"'));
  assert.ok(languageProvider.includes('href="/en"'));
  assert.ok(languageProvider.includes('aria-current={locale === "zh" ? "page" : undefined}'));
  assert.ok(languageProvider.includes('aria-current={locale === "en" ? "page" : undefined}'));
  assert.ok(languageProvider.includes('onClick={() => setLanguage("zh")}'));
  assert.ok(languageProvider.includes('onClick={() => setLanguage("en")}'));
  assert.ok(languageProvider.includes("export function LanguageToggle"));
});

test("root layout renders the request language and production metadata base", () => {
  const rootLayout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");

  assert.ok(rootLayout.includes('headers().get("x-atlora-locale")'));
  assert.ok(rootLayout.includes('lang={initialLanguage === "en" ? "en" : "zh-CN"}'));
  assert.ok(rootLayout.includes("metadataBase: new URL(siteUrl)"));
  assert.ok(rootLayout.includes("<LanguageProvider initialLanguage={initialLanguage}>"));
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
