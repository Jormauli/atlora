import { readFileSync } from "fs";
import path from "path";

loadDotEnv();

const endpoint = process.env.WECHAT_PERSONAL_ENDPOINT ?? "http://127.0.0.1:3000/api/inbox/wechat-personal";
const token = process.env.WECHAT_PERSONAL_WEBHOOK_TOKEN;
const text = process.argv.slice(2).join(" ").trim();

async function main() {
  if (!token) {
    throw new Error("WECHAT_PERSONAL_WEBHOOK_TOKEN is required");
  }

  if (!text) {
    throw new Error("usage: npm run wechat:personal:test -- <message text>");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sender: "local-personal-wechat-test",
      text,
      receivedAt: new Date().toISOString()
    })
  });

  const body = await response.text();
  console.log(`${response.status} ${response.statusText}`);
  console.log(body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

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
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    return;
  }
}
