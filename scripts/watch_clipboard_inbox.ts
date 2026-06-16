import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

loadDotEnv();

const endpoint = process.env.WECHAT_PERSONAL_ENDPOINT ?? "http://127.0.0.1:3000/api/inbox/wechat-personal";
const token = process.env.WECHAT_PERSONAL_WEBHOOK_TOKEN;
const intervalMs = Number(process.env.CLIPBOARD_INBOX_INTERVAL_MS ?? 2000);
const minChars = Number(process.env.CLIPBOARD_INBOX_MIN_CHARS ?? 8);
let lastValue = "";

async function main() {
  if (!token) throw new Error("WECHAT_PERSONAL_WEBHOOK_TOKEN is required");
  lastValue = readClipboard();
  console.log("Watching clipboard. Copy a WeChat article URL or text to create a draft card. Press Ctrl+C to stop.");

  while (true) {
    try {
      const text = readClipboard();
      if (shouldForward(text)) {
        lastValue = text;
        await forward(text);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
    await sleep(intervalMs);
  }
}

function readClipboard() {
  return execFileSync("pbpaste", { encoding: "utf8" }).trim();
}

export function shouldForwardClipboardText(text: string, previous: string) {
  const compact = text.replace(/\s+/g, "");
  if (compact === previous.replace(/\s+/g, "")) return false;
  if (/https?:\/\/[^\s"'<>，。！？、]+/i.test(text)) return true;
  const chineseChars = compact.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  return compact.length >= minChars && chineseChars >= 4;
}

function shouldForward(text: string) {
  return shouldForwardClipboardText(text, lastValue);
}

async function forward(text: string) {
  console.log(`Detected clipboard text: ${text.slice(0, 120)}`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sender: "clipboard-inbox",
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

if (process.argv[1]?.endsWith("watch_clipboard_inbox.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
