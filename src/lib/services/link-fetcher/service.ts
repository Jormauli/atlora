import * as cheerio from "cheerio";
import { fetchWeChatArticleContent, isWeChatArticleUrl } from "./wechat";

export interface LinkFetchResult {
  ok: boolean;
  title?: string;
  description?: string;
  text?: string;
  domain?: string;
  strategy?: "web" | "wechat_markdown" | "wechat_screenshot_ocr" | "wechat_fallback";
  hint?: string;
  ocrConfidence?: number;
}

export async function fetchLinkContent(input: {
  userId: string;
  url: string;
  relatedId: string;
}): Promise<LinkFetchResult> {
  if (isWeChatArticleUrl(input.url)) {
    return fetchWeChatArticleContent(input);
  }
  try {
    const response = await fetch(input.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error("Fetch failed");
    const html = await response.text();
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();
    return {
      ok: true,
      title: $("title").first().text().trim() || undefined,
      description: $('meta[name="description"]').attr("content") || undefined,
      text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000),
      domain: new URL(input.url).hostname,
      strategy: "web"
    };
  } catch {
    return { ok: false, domain: new URL(input.url).hostname, strategy: "web" };
  }
}
