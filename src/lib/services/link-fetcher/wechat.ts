import { execFile } from "child_process";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { getOCRProvider } from "@/lib/providers/ocr";
import { recordUsage } from "@/lib/services/usage/service";

const execFileAsync = promisify(execFile);

export interface WeChatFetchResult {
  ok: boolean;
  title?: string;
  text?: string;
  domain: string;
  strategy: "wechat_markdown" | "wechat_screenshot_ocr" | "wechat_fallback";
  hint?: string;
  ocrConfidence?: number;
}

export function isWeChatArticleUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "mp.weixin.qq.com";
  } catch {
    return false;
  }
}

export async function fetchWeChatArticleContent(input: {
  userId: string;
  url: string;
  relatedId: string;
}): Promise<WeChatFetchResult> {
  const domain = new URL(input.url).hostname;
  const markdown = await tryMarkdownExtraction(input.url);
  if (markdown) {
    return {
      ok: true,
      title: markdown.title,
      text: markdown.text,
      domain,
      strategy: "wechat_markdown"
    };
  }

  const screenshot = await tryScreenshotOCR(input);
  if (screenshot) {
    return {
      ok: true,
      title: screenshot.title,
      text: screenshot.text,
      domain,
      strategy: "wechat_screenshot_ocr",
      ocrConfidence: screenshot.confidence
    };
  }

  return {
    ok: false,
    domain,
    strategy: "wechat_fallback",
    hint: "链接正文无法读取，已保存链接。你可以使用公众号自带的下载截图功能后上传图片。"
  };
}

async function tryMarkdownExtraction(url: string) {
  const python = process.env.WECHAT_ARTICLE_PYTHON;
  const toolDir = process.env.WECHAT_ARTICLE_TOOL_DIR;
  if (!python || !toolDir) return null;

  const outputDir = await mkdtemp(path.join(os.tmpdir(), "wechat-md-"));
  try {
    await execFileAsync(python, ["main.py", url, "--no-images", "--force", "-o", outputDir], {
      cwd: toolDir,
      timeout: 120000
    });
    const articleDirNames = await readdir(outputDir);
    for (const articleDirName of articleDirNames) {
      const articleDir = path.join(outputDir, articleDirName);
      const articleFiles = await readdir(articleDir).catch(() => []);
      const markdownFile = articleFiles.find((file) => file.endsWith(".md"));
      if (!markdownFile) continue;
      const raw = await readFile(path.join(articleDir, markdownFile), "utf8");
      return parseMarkdown(raw);
    }
    return null;
  } catch {
    return null;
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}

async function tryScreenshotOCR(input: { userId: string; url: string; relatedId: string }) {
  const python = process.env.WECHAT_ARTICLE_PYTHON;
  if (!python) return null;
  const screenshotPath = path.join(os.tmpdir(), `wechat-shot-${Date.now()}.png`);
  try {
    await execFileAsync(python, [path.join(process.cwd(), "scripts/capture_wechat_article.py"), input.url, screenshotPath], {
      timeout: 120000
    });
    const ocr = await getOCRProvider().extractText({
      id: `wechat-shot-${input.relatedId}`,
      path: screenshotPath,
      mimeType: "image/png"
    });
    const minConfidence = Number(process.env.WECHAT_SCREENSHOT_OCR_MIN_CONFIDENCE ?? 0.85);
    if (ocr.confidence < minConfidence || !looksLikeUsableArticleText(ocr.text)) return null;
    await recordUsage({
      userId: input.userId,
      usageType: "ocr",
      taskType: "vision_analysis",
      provider: process.env.OCR_PROVIDER ?? "mock",
      modelName: process.env.OCR_PROVIDER ?? "mock",
      relatedId: input.relatedId
    });
    return {
      title: firstNonEmptyLine(ocr.text),
      text: ocr.text,
      confidence: ocr.confidence
    };
  } catch {
    return null;
  } finally {
    await rm(screenshotPath, { force: true });
  }
}

function parseMarkdown(raw: string) {
  const withoutFrontmatter = raw.replace(/^---[\s\S]*?---\s*/m, "");
  const lines = withoutFrontmatter.split("\n");
  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine?.replace(/^#\s+/, "").trim();
  const text = withoutFrontmatter
    .replace(/^#\s+.+$/m, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? { title, text } : null;
}

function firstNonEmptyLine(text: string) {
  return text.split("\n").map((line) => line.trim()).find(Boolean);
}

function looksLikeUsableArticleText(text: string) {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 120) return false;
  const chineseChars = compact.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  return chineseChars / compact.length >= 0.2;
}
