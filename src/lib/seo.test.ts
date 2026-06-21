import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLocaleMetadata,
  buildWebApplicationJsonLd,
  isIndexablePath,
  isSeoLocale,
  localeFromPath,
  siteUrl,
  type SeoLocale,
} from "./seo";

const locales: SeoLocale[] = ["zh", "en"];

test("exports the production site URL and recognizes only approved locales", () => {
  assert.equal(siteUrl, "https://www.atlora.io");
  assert.equal(isSeoLocale("zh"), true);
  assert.equal(isSeoLocale("en"), true);
  assert.equal(isSeoLocale("zh-Hans"), false);
  assert.equal(isSeoLocale("EN"), false);
  assert.equal(isSeoLocale(""), false);
});

test("extracts locales only from exact public homepage paths", () => {
  assert.equal(localeFromPath("/zh"), "zh");
  assert.equal(localeFromPath("/zh/"), "zh");
  assert.equal(localeFromPath("/en"), "en");
  assert.equal(localeFromPath("/en/"), "en");

  for (const pathname of [
    "/",
    "/english",
    "/enough",
    "/en/about",
    "/zh/cards",
    "/zh//",
    "en",
  ]) {
    assert.equal(localeFromPath(pathname), null, pathname);
  }
});

test("marks only localized public homepages as indexable", () => {
  for (const pathname of ["/zh", "/zh/", "/en", "/en/"]) {
    assert.equal(isIndexablePath(pathname), true, pathname);
  }

  for (const pathname of ["/", "/english", "/enough", "/en/about", "/zh/cards"]) {
    assert.equal(isIndexablePath(pathname), false, pathname);
  }
});

test("builds unique localized titles, descriptions, and restrained keywords", () => {
  const zh = buildLocaleMetadata("zh");
  const en = buildLocaleMetadata("en");

  assert.equal(zh.title, "AI 文章总结与知识卡片工具 | Atlora 知识星域");
  assert.equal(en.title, "AI Article Summarizer & Knowledge Card Generator | Atlora");
  assert.notEqual(zh.title, en.title);

  assert.equal(typeof zh.description, "string");
  assert.equal(typeof en.description, "string");
  assert.notEqual(zh.description, en.description);
  assert.match(zh.description as string, /链接、文本和图片/);
  assert.match(zh.description as string, /摘要/);
  assert.match(zh.description as string, /核心主张、证据和行动/);
  assert.match(zh.description as string, /知识卡片/);
  assert.match(en.description as string, /links, text, and images/i);
  assert.match(en.description as string, /summaries/i);
  assert.match(en.description as string, /core claims, evidence, and actions/i);
  assert.match(en.description as string, /knowledge cards/i);

  assert.ok(Array.isArray(zh.keywords));
  assert.ok(Array.isArray(en.keywords));
  assert.notDeepEqual(zh.keywords, en.keywords);
  assert.ok((zh.keywords as string[]).includes("Atlora 知识星域"));
  assert.ok((en.keywords as string[]).includes("Atlora"));
  assert.ok((zh.keywords as string[]).length <= 10);
  assert.ok((en.keywords as string[]).length <= 10);
});

test("builds exact canonical and language alternate URLs", () => {
  for (const locale of locales) {
    const metadata = buildLocaleMetadata(locale);

    assert.equal(metadata.alternates?.canonical, `${siteUrl}/${locale}`);
    assert.deepEqual(metadata.alternates?.languages, {
      "zh-Hans": `${siteUrl}/zh`,
      en: `${siteUrl}/en`,
      "x-default": `${siteUrl}/zh`,
    });
  }
});

test("localizes Open Graph and Twitter metadata", () => {
  const zh = buildLocaleMetadata("zh");
  const en = buildLocaleMetadata("en");

  assert.deepEqual(zh.openGraph, {
    title: zh.title,
    description: zh.description,
    url: `${siteUrl}/zh`,
    siteName: "Atlora",
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
  });
  assert.deepEqual(en.openGraph, {
    title: en.title,
    description: en.description,
    url: `${siteUrl}/en`,
    siteName: "Atlora",
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
  });
  assert.deepEqual(zh.twitter, {
    card: "summary_large_image",
    title: zh.title,
    description: zh.description,
  });
  assert.deepEqual(en.twitter, {
    card: "summary_large_image",
    title: en.title,
    description: en.description,
  });
});

test("builds factual localized WebApplication JSON-LD", () => {
  const zh = buildWebApplicationJsonLd("zh");
  const en = buildWebApplicationJsonLd("en");

  for (const [locale, jsonLd] of [
    ["zh", zh],
    ["en", en],
  ] as const) {
    assert.equal(jsonLd["@context"], "https://schema.org");
    assert.equal(jsonLd["@type"], "WebApplication");
    assert.equal(jsonLd.url, `${siteUrl}/${locale}`);
    assert.equal(jsonLd.applicationCategory, "ProductivityApplication");
    assert.equal(jsonLd.operatingSystem, "Web");
    assert.equal(jsonLd.browserRequirements, "Requires JavaScript and a modern web browser");
    assert.equal(jsonLd.inLanguage, locale === "zh" ? "zh-Hans" : "en");
    assert.ok(Array.isArray(jsonLd.featureList));
    assert.ok(jsonLd.featureList.length >= 4);
    assert.doesNotThrow(() => JSON.stringify(jsonLd));

    for (const unsupported of [
      "offers",
      "aggregateRating",
      "rating",
      "ratings",
      "review",
      "reviews",
      "userCount",
    ]) {
      assert.equal(unsupported in jsonLd, false, unsupported);
    }
  }

  assert.notEqual(zh.name, en.name);
  assert.notEqual(zh.description, en.description);
  assert.notDeepEqual(zh.featureList, en.featureList);
  assert.match(zh.featureList.join(" "), /链接|文本|图片/);
  assert.match(en.featureList.join(" "), /link|text|image/i);
});
