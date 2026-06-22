# Atlora Bilingual SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish independently crawlable Chinese and English Atlora homepages with localized metadata while excluding all private application routes from search indexes.

**Architecture:** A pure `seo` module owns locale validation, production URLs, localized metadata copy, and structured-data values. `/zh` and `/en` render the existing public homepage with explicit server-selected copy; middleware supplies the document language and response-level indexing policy, while Next.js metadata routes publish the sitemap, robots file, and social image.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Next.js Metadata API, Node test runner, Tailwind CSS

---

## File Structure

- Create `src/lib/seo.ts`: locale validation, canonical URLs, metadata builders, JSON-LD builders, and crawl-policy helpers.
- Create `src/lib/seo.test.ts`: behavior tests for all pure SEO rules.
- Create `src/app/[locale]/page.tsx`: localized public entry and per-locale metadata.
- Create `src/app/sitemap.ts`: production sitemap containing only public locale routes.
- Create `src/app/robots.ts`: production crawler rules and sitemap location.
- Create `src/app/opengraph-image.tsx`: 1200 x 630 Atlora social preview.
- Modify `src/app/page.tsx`: redirect unauthenticated visitors to `/zh`.
- Modify `src/app/layout.tsx`: metadata base, title template, and request-derived HTML language.
- Modify `src/components/language-provider.tsx`: accept a server initial language, persist it to local storage and a cookie, and expose crawlable public locale links.
- Modify `src/components/public-home.tsx`: render explicit locale copy and use localized navigation.
- Modify `middleware.ts`: pass locale to the root layout and add private-route `X-Robots-Tag` headers.
- Modify `middleware.test.ts`: test public indexing, private noindex, and locale request headers.
- Modify `src/app/public-entry.test.ts`: test localized entry routes and crawlable language links.

### Task 1: Centralize Locale And SEO Rules

**Files:**
- Create: `src/lib/seo.ts`
- Create: `src/lib/seo.test.ts`

- [ ] **Step 1: Write failing locale and metadata tests**

Create tests asserting that only `zh` and `en` are accepted, canonical URLs use `https://www.atlora.io`, titles are unique, alternates include `zh-Hans`, `en`, and `x-default`, and private paths are not indexable.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLocaleMetadata,
  buildWebApplicationJsonLd,
  isIndexablePath,
  isSeoLocale,
  siteUrl
} from "./seo";

test("SEO locales are limited to Chinese and English", () => {
  assert.equal(isSeoLocale("zh"), true);
  assert.equal(isSeoLocale("en"), true);
  assert.equal(isSeoLocale("fr"), false);
});

test("localized metadata exposes canonical and language alternates", () => {
  const zh = buildLocaleMetadata("zh");
  const en = buildLocaleMetadata("en");
  assert.notEqual(zh.title, en.title);
  assert.equal(zh.alternates?.canonical, `${siteUrl}/zh`);
  assert.equal(en.alternates?.canonical, `${siteUrl}/en`);
  assert.deepEqual(zh.alternates?.languages, {
    "zh-Hans": `${siteUrl}/zh`,
    en: `${siteUrl}/en`,
    "x-default": `${siteUrl}/zh`
  });
});

test("structured data is factual and localized", () => {
  const jsonLd = buildWebApplicationJsonLd("en");
  assert.equal(jsonLd["@type"], "WebApplication");
  assert.equal(jsonLd.url, `${siteUrl}/en`);
  assert.equal("aggregateRating" in jsonLd, false);
  assert.equal("offers" in jsonLd, false);
});

test("only localized public homepages are indexable", () => {
  assert.equal(isIndexablePath("/zh"), true);
  assert.equal(isIndexablePath("/en"), true);
  assert.equal(isIndexablePath("/dashboard"), false);
  assert.equal(isIndexablePath("/login"), false);
  assert.equal(isIndexablePath("/api/cards"), false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test src/lib/seo.test.ts`

Expected: FAIL because `src/lib/seo.ts` does not exist.

- [ ] **Step 3: Implement the pure SEO module**

Define `SeoLocale = "zh" | "en"`, `siteUrl = "https://www.atlora.io"`, localized title/description/keyword/feature values, and these exported functions:

```ts
export function isSeoLocale(value: string): value is SeoLocale;
export function buildLocaleMetadata(locale: SeoLocale): Metadata;
export function buildWebApplicationJsonLd(locale: SeoLocale): Record<string, unknown>;
export function isIndexablePath(pathname: string): boolean;
export function localeFromPath(pathname: string): SeoLocale | null;
```

Use these exact titles:

```ts
zh: "AI 文章总结与知识卡片工具 | Atlora 知识星域"
en: "AI Article Summarizer & Knowledge Card Generator | Atlora"
```

Use canonical locale URLs and matching Open Graph/Twitter values. Keep keywords restrained to the intent clusters in the approved design.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test src/lib/seo.test.ts`

Expected: all SEO tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat: define bilingual SEO metadata"
```

### Task 2: Add Server-Rendered Locale Routes

**Files:**
- Create: `src/app/[locale]/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/public-home.tsx`
- Modify: `src/components/language-provider.tsx`
- Modify: `src/app/public-entry.test.ts`

- [ ] **Step 1: Write failing public-route tests**

Extend `src/app/public-entry.test.ts` to require the locale page, explicit locale prop, root `/zh` redirect, public locale links, and persisted language cookie.

```ts
test("public entry has crawlable Chinese and English routes", () => {
  const rootPage = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const localePage = readFileSync(path.join(root, "src/app/[locale]/page.tsx"), "utf8");
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");
  const provider = readFileSync(path.join(root, "src/components/language-provider.tsx"), "utf8");

  assert.ok(rootPage.includes('redirect("/zh")'));
  assert.ok(localePage.includes("isSeoLocale"));
  assert.ok(localePage.includes("<PublicHome locale={locale}"));
  assert.ok(publicHome.includes("LocaleLanguageToggle"));
  assert.ok(provider.includes('href="/zh"'));
  assert.ok(provider.includes('href="/en"'));
  assert.ok(provider.includes("document.cookie"));
});
```

Update the old public-entry assertion so it expects `PublicHome` in the locale page rather than the root page.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test src/app/public-entry.test.ts`

Expected: FAIL because `src/app/[locale]/page.tsx` and localized links do not exist.

- [ ] **Step 3: Implement localized entry pages and language state**

In `src/app/[locale]/page.tsx`, validate the segment with `isSeoLocale`, call `notFound()` for unsupported values, preserve the authenticated `/dashboard` redirect, export `generateStaticParams`, export `generateMetadata`, render JSON-LD with `<` escaped as `\u003c`, and render `<PublicHome locale={locale} />`.

Change `/` so an unauthenticated request calls `redirect("/zh")`.

Change `PublicHome` to accept:

```ts
type PublicHomeProps = { locale: SeoLocale };
```

Read `uiCopy[locale]` directly for the first render. Synchronize `setLanguage(locale)` in an effect and replace the generic toggle with `LocaleLanguageToggle`.

In `LanguageProvider`, accept `initialLanguage?: UiLanguage`, initialize state from it, and persist updates with:

```ts
window.localStorage.setItem(storageKey, nextLanguage);
document.cookie = `${storageKey}=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
```

Add `LocaleLanguageToggle` using normal Next.js links to `/zh` and `/en`, with `aria-current="page"` on the active locale.

- [ ] **Step 4: Run public and language tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx 'src/app/[locale]/page.tsx' src/components/public-home.tsx src/components/language-provider.tsx src/app/public-entry.test.ts
git commit -m "feat: add localized public home routes"
```

### Task 3: Set Document Language And Private Indexing Policy

**Files:**
- Modify: `middleware.ts`
- Modify: `middleware.test.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write failing middleware tests**

Add tests showing that `/en` forwards `x-atlora-locale: en`, `/zh` remains indexable, `/login` and authenticated `/dashboard` return `X-Robots-Tag: noindex, nofollow`, and an English language cookie sets English for `/login`.

```ts
test("middleware forwards public locale without blocking indexing", async () => {
  const response = await middleware(new NextRequest("http://localhost/en"));
  assert.equal(response.headers.get("x-robots-tag"), null);
  assert.equal(response.headers.get("x-middleware-request-x-atlora-locale"), "en");
});

test("middleware prevents indexing of utility routes", async () => {
  const response = await middleware(new NextRequest("http://localhost/login"));
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("middleware forwards stored application language", async () => {
  const request = new NextRequest("http://localhost/login", {
    headers: { cookie: "atlora-ui-language=en" }
  });
  const response = await middleware(request);
  assert.equal(response.headers.get("x-middleware-request-x-atlora-locale"), "en");
});
```

- [ ] **Step 2: Run middleware tests and verify RED**

Run: `npx tsx --test middleware.test.ts`

Expected: FAIL because locale forwarding and noindex headers are missing.

- [ ] **Step 3: Implement middleware response policy**

For every matched request, derive locale from `/zh` or `/en`, then from the `atlora-ui-language` cookie, otherwise use `zh`. Forward it as `x-atlora-locale` in request headers. Add `X-Robots-Tag: noindex, nofollow` whenever `isIndexablePath(pathname)` is false, including protected-route redirects.

Expand the matcher to all application requests except Next.js static/image files and the favicon:

```ts
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```

In `src/app/layout.tsx`, read `headers().get("x-atlora-locale")`, set `<html lang="en">` or `<html lang="zh-CN">`, pass `initialLanguage` into `LanguageProvider`, set `metadataBase`, and add a title template without overriding localized page titles.

- [ ] **Step 4: Run middleware and public tests**

Run: `npx tsx --test middleware.test.ts src/app/public-entry.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts middleware.test.ts src/app/layout.tsx
git commit -m "feat: enforce localized crawl policy"
```

### Task 4: Publish Sitemap, Robots, And Social Preview

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/opengraph-image.tsx`
- Create: `src/app/seo-routes.test.ts`

- [ ] **Step 1: Write failing metadata-route tests**

Create source and behavior tests that import sitemap and robots, assert the exact public URLs, assert private disallow rules, and require a 1200 x 630 social image route.

```ts
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
});

test("robots points to production sitemap and blocks private routes", () => {
  const value = robots();
  assert.equal(value.sitemap, "https://www.atlora.io/sitemap.xml");
  assert.ok(value.rules && !Array.isArray(value.rules));
  assert.ok(value.rules.disallow?.includes("/api/"));
  assert.equal(value.rules.disallow?.includes("/dashboard"), false);
});

test("social preview uses the standard Open Graph dimensions", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/opengraph-image.tsx"), "utf8");
  assert.ok(source.includes("width: 1200"));
  assert.ok(source.includes("height: 630"));
  assert.ok(source.includes("Atlora"));
});
```

- [ ] **Step 2: Run metadata-route tests and verify RED**

Run: `npx tsx --test src/app/seo-routes.test.ts`

Expected: FAIL because the metadata routes do not exist.

- [ ] **Step 3: Implement metadata routes and social image**

Return two sitemap entries with weekly change frequency and priority `1`. Return one robots rule allowing the site while disallowing `/api/` only. Do not disallow private HTML routes: crawlers need to access those responses to observe their `X-Robots-Tag: noindex, nofollow` directive.

Create an `ImageResponse` social image with:

```ts
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
```

Use the current `#111111` surface, restrained blue/gold/red orbital accents, a code-native Stellar Core mark, `Atlora`, `Knowledge Starfield`, and `AI Article Summarizer & Knowledge Card Generator`. Keep all text inside generous safe margins.

- [ ] **Step 4: Run metadata-route tests and build**

Run: `npx tsx --test src/app/seo-routes.test.ts && npm run build`

Expected: tests PASS and Next.js production build succeeds with `/sitemap.xml`, `/robots.txt`, and `/opengraph-image` routes.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/opengraph-image.tsx src/app/seo-routes.test.ts
git commit -m "feat: publish SEO discovery assets"
```

### Task 5: Full Regression And Browser Verification

**Files:**
- Modify only files required by issues found during verification.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all tests PASS with no skipped SEO tests.

- [ ] **Step 2: Run production verification**

Run: `npm run build && git diff --check`

Expected: build succeeds and `git diff --check` prints no output.

- [ ] **Step 3: Verify localized HTML and metadata**

Start the local production server and verify `/zh` and `/en` at desktop and mobile widths. Inspect page source or browser metadata to confirm unique title, description, canonical, alternates, JSON-LD, Open Graph values, and matching `<html lang>`.

- [ ] **Step 4: Verify crawl boundaries and product regression**

Confirm `/sitemap.xml`, `/robots.txt`, and `/opengraph-image` render. Confirm `/login`, `/dashboard`, and `/api/cards` responses contain `X-Robots-Tag: noindex, nofollow`. Test public language switching, login, registration entry, and authenticated dashboard navigation.

- [ ] **Step 5: Record final verification commit if fixes were needed**

```bash
git add src middleware.ts middleware.test.ts
git commit -m "fix: complete bilingual SEO verification"
```

If no fixes were needed, do not create an empty commit.
