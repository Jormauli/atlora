import { readFileSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import os from "os";
import path from "path";
import { TencentOCRProvider } from "@/lib/providers/ocr/tencent";

loadDotEnv();

const endpoint = process.env.WECHAT_PERSONAL_ENDPOINT ?? "http://127.0.0.1:3000/api/inbox/wechat-personal";
const token = process.env.WECHAT_PERSONAL_WEBHOOK_TOKEN;
const intervalMs = Number(process.env.WECHAT_PERSONAL_WATCH_INTERVAL_MS ?? 5000);
const minTextLength = Number(process.env.WECHAT_PERSONAL_WATCH_MIN_CHARS ?? 8);
let lastFingerprint = "";

async function main() {
  if (!token) throw new Error("WECHAT_PERSONAL_WEBHOOK_TOKEN is required");
  console.log("Watching Mac WeChat File Transfer Assistant. Press Ctrl+C to stop.");
  console.log(`Forwarding detected text to ${endpoint}`);

  while (true) {
    await tick().catch((error) => {
      console.error(error instanceof Error ? error.message : error);
    });
    await sleep(intervalMs);
  }
}

async function tick() {
  activateWeChat();
  const screenshotPath = path.join(os.tmpdir(), `wechat-file-transfer-${Date.now()}.png`);
  try {
    execFileSync("screencapture", ["-x", screenshotPath], { stdio: "ignore" });
    const ocr = await new TencentOCRProvider().extractText({
      id: "wechat-file-transfer-screenshot",
      path: screenshotPath,
      mimeType: "image/png"
    });
    const message = extractLikelyMessage(ocr.text);
    if (!message) return;
    const fingerprint = message.replace(/\s+/g, "");
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    await forward(message);
  } finally {
    rmSync(screenshotPath, { force: true });
  }
}

function activateWeChat() {
  execFileSync("osascript", ["-e", 'tell application "WeChat" to activate'], { stdio: "ignore" });
}

export function extractLikelyMessage(ocrText: string) {
  const ignored = new Set([
    "微信",
    "文件传输助手",
    "搜索",
    "新的消息",
    "按住说话"
  ]);
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= minTextLength)
    .filter((line) => !ignored.has(line))
    .filter((line) => !line.includes("文件传输助手"))
    .filter((line) => !line.includes("WeChat"));

  const urlLine = [...lines].reverse().find((line) => /https?:\/\//i.test(line));
  if (urlLine) return urlLine;
  return lines.reverse().find(isLikelyUserMessage) ?? null;
}

function isLikelyUserMessage(line: string) {
  const compact = line.replace(/\s+/g, "");
  if (compact.length < minTextLength) return false;
  const chineseChars = compact.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  if (chineseChars >= 4) return true;
  return /https?:\/\//i.test(compact);
}

async function forward(text: string) {
  console.log(`Detected: ${text}`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sender: "file-transfer-assistant",
      text,
      receivedAt: new Date().toISOString()
    })
  });
  const body = await response.text();
  console.log(`${response.status} ${response.statusText} ${body}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  } catch {
    return;
  }
}

if (process.argv[1]?.endsWith("watch_wechat_file_transfer.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
