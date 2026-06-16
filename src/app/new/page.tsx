"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, LinkIcon } from "lucide-react";
import { AppShellClient } from "@/components/app-shell-client";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { readJsonSafely } from "@/lib/client/http";
import { contentViews } from "@/lib/content-views";

const templates = [
  ["auto", "自动判断"],
  ...contentViews.map((view) => [`content_view__${view.id}`, view.label])
];

const textStages = [
  { label: "正在读取文本", detail: "检查文本长度和基本结构", afterMs: 0 },
  { label: "正在判断视角", detail: "从你选择的观测视角里匹配 1-2 个最合适的方向", afterMs: 1200 },
  { label: "正在生成卡片", detail: "整理总结、核心观点和观测提炼", afterMs: 3500 }
];

const imageStages = [
  { label: "正在上传图片", detail: "先校验图片格式和大小", afterMs: 0 },
  { label: "正在识别图片", detail: "提取截图里的正文或关键信息", afterMs: 1500 },
  { label: "正在生成卡片", detail: "把识别结果整理成草稿", afterMs: 4500 }
];

const linkStages = [
  { label: "正在打开链接", detail: "先尝试读取网页正文", afterMs: 0 },
  { label: "正在提取正文", detail: "公众号链接可能需要多一点时间", afterMs: 3500 },
  { label: "正在尝试备用读取", detail: "如果正文不可读，会自动尝试截图识别", afterMs: 10000 },
  { label: "正在生成卡片", detail: "把读取结果整理成草稿", afterMs: 18000 }
];

export default function NewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"text" | "image" | "link">("text");
  const [templateId, setTemplateId] = useState("auto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setLoadingElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function submitText(formData: FormData) {
    await submit("/api/ingestions/text", { text: formData.get("text"), templateId }, "生成中...");
  }
  async function submitLink(formData: FormData) {
    await submit("/api/ingestions/link", { url: formData.get("url"), templateId }, "阅读中...");
  }
  async function submitImage(formData: FormData) {
    setLoading(true);
    setLoadingLabel("识别中...");
    setError("");
    formData.set("templateId", templateId);
    const response = await fetch("/api/ingestions/image", { method: "POST", body: formData });
    const body = await readJsonSafely(response);
    setLoading(false);
    setLoadingLabel("");
    if (!response.ok) return setError(errorAdvice("image", body?.error));
    router.push(`/cards/${body!.card.id}/draft`);
  }
  async function submit(url: string, payload: unknown, label: string) {
    setLoading(true);
    setLoadingLabel(label);
    setError("");
    await nextPaint();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await readJsonSafely(response);
    setLoading(false);
    setLoadingLabel("");
    if (!response.ok) return setError(errorAdvice(tab, body?.error));
    router.push(`/cards/${body!.card.id}/draft`);
  }
  return (
    <AppShellClient>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">atlora / new planet</div>
          <h1 className="mt-1 text-2xl font-semibold">新建素材</h1>
          <p className="mt-1 text-sm text-[#b9b1a3]">把文本、截图或链接整理成一颗可检索的知识星球</p>
        </div>
      </header>
      <div className="mt-6 rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="grid gap-2 sm:grid-cols-3">
          {(["text", "image", "link"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${tab === item ? "border-[#9bb27e] bg-[#d9e7c6] text-[#172018]" : "border-[#354039] bg-[#101412] text-[#c9c2b6] hover:bg-white/[0.06]"}`}
            >
              {item === "text" ? <FileText className="h-4 w-4" /> : item === "image" ? <ImageIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              {item === "text" ? "输入文本" : item === "image" ? "上传图片" : "粘贴链接"}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-[#d8d2c6]">观测视角</label>
        <Select className="mt-2 max-w-xs border-[#354039] bg-[#101412] text-[#f4f1e8] focus:ring-[#d9e7c6]" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        {tab === "text" && (
          <form action={submitText} className="mt-5 space-y-4">
            <Textarea name="text" rows={10} placeholder="粘贴文本内容" required className="border-[#354039] bg-[#101412] text-[#f4f1e8] placeholder:text-[#7f897f] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? loadingLabel : "生成卡片草稿"}</Button>
            {loading ? <LoadingProgress stages={textStages} elapsedMs={loadingElapsedMs} /> : null}
          </form>
        )}
        {tab === "image" && (
          <form action={submitImage} className="mt-5 space-y-4">
            <Input name="file" type="file" accept=".jpg,.jpeg,.png,.webp" required className="border-[#354039] bg-[#101412] text-[#f4f1e8] file:mr-3 file:rounded file:border-0 file:bg-[#d9e7c6] file:px-3 file:py-1 file:text-sm file:text-[#172018] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? loadingLabel : "上传并生成"}</Button>
            {loading ? <LoadingProgress stages={imageStages} elapsedMs={loadingElapsedMs} /> : null}
          </form>
        )}
        {tab === "link" && (
          <form action={submitLink} className="mt-5 space-y-4">
            <Input name="url" type="url" placeholder="https://..." required className="border-[#354039] bg-[#101412] text-[#f4f1e8] placeholder:text-[#7f897f] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? "阅读中..." : "生成链接卡片"}</Button>
            {loading ? <LoadingProgress stages={linkStages} elapsedMs={loadingElapsedMs} /> : null}
          </form>
        )}
        {error && <p className="mt-4 rounded-md border border-[#6b3b3b] bg-[#261717] px-3 py-2 text-sm text-[#f0c8c8]">{error}</p>}
      </div>
    </AppShellClient>
  );
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function LoadingProgress({ stages, elapsedMs }: { stages: typeof textStages; elapsedMs: number }) {
  const activeStageIndex = findActiveStageIndex(stages, elapsedMs);
  const activeStage = stages[activeStageIndex];
  const progress = Math.min(92, 12 + activeStageIndex * 24 + elapsedMs / 1400);

  return (
    <div className="rounded-md border border-[#354039] bg-[#101412] px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-[#f4f1e8]">{activeStage.label}</p>
        <p className="text-xs text-[#9ba79d]">已等待 {Math.max(1, Math.ceil(elapsedMs / 1000))} 秒</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#29302d]">
        <div
          className="h-full rounded-full bg-[#d9e7c6] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[#b9b1a3]">{activeStage.detail}</p>
    </div>
  );
}

function findActiveStageIndex(stages: typeof textStages, elapsedMs: number) {
  for (let index = stages.length - 1; index >= 0; index -= 1) {
    if (elapsedMs >= stages[index].afterMs) return index;
  }
  return 0;
}

function errorAdvice(kind: "text" | "image" | "link", message?: string) {
  const prefix = message || "生成失败。";
  const advice = {
    text: "文本太短或结构不清时，可以多粘贴几段正文，或直接粘贴原文标题、摘要和关键段落。",
    image: "图片识别失败时，可以换一张更清晰的截图，裁掉无关区域，或改用复制文本上传。",
    link: "链接打不开或正文不可读时，可以手动复制正文、上传文章截图，或确认链接没有登录/权限限制。"
  };
  return `${prefix} ${advice[kind]}`;
}
