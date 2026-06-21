import type { Metadata } from "next";

export type SeoLocale = "zh" | "en";

export const siteUrl = "https://www.atlora.io";

type LocaleContent = {
  title: string;
  description: string;
  keywords: string[];
  name: string;
  language: string;
  openGraphLocale: string;
  alternateOpenGraphLocale: string;
  featureList: string[];
};

const localeContent: Record<SeoLocale, LocaleContent> = {
  zh: {
    title: "AI 文章总结与知识卡片工具 | Atlora 知识星域",
    description:
      "Atlora 知识星域支持链接、文本和图片输入，生成摘要并提取核心主张、证据和行动，将结果保存为可回顾的知识卡片。",
    keywords: [
      "AI 文章总结",
      "知识卡片生成器",
      "链接内容总结",
      "图片文字总结",
      "核心观点提取",
      "知识管理工具",
      "Atlora 知识星域",
    ],
    name: "Atlora 知识星域",
    language: "zh-Hans",
    openGraphLocale: "zh_CN",
    alternateOpenGraphLocale: "en_US",
    featureList: [
      "导入链接、文本和图片内容",
      "生成内容摘要",
      "提取核心主张、证据和行动",
      "保存和回顾知识卡片",
    ],
  },
  en: {
    title: "AI Article Summarizer & Knowledge Card Generator | Atlora",
    description:
      "Atlora accepts links, text, and images, creates summaries, extracts core claims, evidence, and actions, and saves the results as knowledge cards for later review.",
    keywords: [
      "AI article summarizer",
      "knowledge card generator",
      "link summarizer",
      "image text summarizer",
      "key claim extraction",
      "knowledge management tool",
      "Atlora",
    ],
    name: "Atlora",
    language: "en",
    openGraphLocale: "en_US",
    alternateOpenGraphLocale: "zh_CN",
    featureList: [
      "Import content from links, text, and images",
      "Generate content summaries",
      "Extract core claims, evidence, and actions",
      "Save and review knowledge cards",
    ],
  },
};

const languageAlternates = {
  "zh-Hans": `${siteUrl}/zh`,
  en: `${siteUrl}/en`,
  "x-default": `${siteUrl}/zh`,
};

export function isSeoLocale(value: string): value is SeoLocale {
  return value === "zh" || value === "en";
}

export function localeFromPath(pathname: string): SeoLocale | null {
  const match = pathname.match(/^\/(zh|en)\/?$/);
  return match && isSeoLocale(match[1]) ? match[1] : null;
}

export function isIndexablePath(pathname: string): boolean {
  return localeFromPath(pathname) !== null;
}

export function buildLocaleMetadata(locale: SeoLocale): Metadata {
  const content = localeContent[locale];
  const url = `${siteUrl}/${locale}`;

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates,
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      siteName: "Atlora",
      type: "website",
      locale: content.openGraphLocale,
      alternateLocale: content.alternateOpenGraphLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
    },
  };
}

export function buildWebApplicationJsonLd(locale: SeoLocale) {
  const content = localeContent[locale];

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: content.name,
    description: content.description,
    url: `${siteUrl}/${locale}`,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript and a modern web browser",
    inLanguage: content.language,
    featureList: content.featureList,
  };
}
