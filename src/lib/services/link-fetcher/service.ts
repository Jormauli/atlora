import * as cheerio from "cheerio";
import { assertSafeLinkUrl } from "./safety";
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
  let domain: string | undefined;
  try {
    const initialUrl = await assertSafeLinkUrl(input.url);
    domain = initialUrl.hostname;
    const response = await fetchHtmlResponse(initialUrl);
    if (!response.ok) throw new Error("Fetch failed");
    if (!isHtmlContentType(response.headers.get("content-type"))) {
      throw new Error("Unsupported content type");
    }
    const html = await readBoundedText(response);
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();
    return {
      ok: true,
      title: $("title").first().text().trim() || undefined,
      description: $('meta[name="description"]').attr("content") || undefined,
      text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 6000),
      domain,
      strategy: "web"
    };
  } catch {
    return { ok: false, domain: domain ?? safeDomain(input.url), strategy: "web" };
  }
}

const linkFetchTimeoutMs = 8000;
const maxLinkBodyBytes = 2 * 1024 * 1024;
const maxRedirects = 5;

async function fetchHtmlResponse(initialUrl: URL) {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(linkFetchTimeoutMs)
    });
    if (!isRedirect(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirect location missing");
    currentUrl = await assertSafeLinkUrl(new URL(location, currentUrl).toString());
  }
  throw new Error("Too many redirects");
}

function isRedirect(status: number) {
  return [301, 302, 303, 307, 308].includes(status);
}

function isHtmlContentType(contentType: string | null) {
  if (!contentType) return false;
  const mimeType = contentType.split(";")[0].trim().toLowerCase();
  return mimeType === "text/html" || mimeType === "application/xhtml+xml";
}

async function readBoundedText(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let html = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    totalBytes += chunk.value.byteLength;
    if (totalBytes > maxLinkBodyBytes) {
      await reader.cancel();
      throw new Error("Link body too large");
    }
    html += decoder.decode(chunk.value, { stream: true });
  }

  return html + decoder.decode();
}

function safeDomain(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return undefined;
  }
}
