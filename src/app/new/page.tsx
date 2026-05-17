"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShellClient } from "@/components/app-shell-client";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { readJsonSafely } from "@/lib/client/http";

const templates = [
  ["auto", "自动判断"],
  ["general_summary", "普通摘要"],
  ["content_creator", "内容创作者"],
  ["startup_product", "创业 / 产品"],
  ["investment_info", "投资信息"],
  ["tool_app", "工具应用"],
  ["learning_note", "学习笔记"]
];

export default function NewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"text" | "image" | "link">("text");
  const [templateId, setTemplateId] = useState("auto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [linkStageIndex, setLinkStageIndex] = useState(0);
  const linkStages = ["正在打开链接...", "正在提取正文...", "正在生成卡片..."];

  useEffect(() => {
    if (!loading || tab !== "link") {
      setLinkStageIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setLinkStageIndex((current) => Math.min(current + 1, linkStages.length - 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [loading, tab]);

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
    if (!response.ok) return setError(body?.error ?? "生成失败，请稍后重试。");
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
    if (!response.ok) return setError(body?.error ?? "生成失败，请稍后重试。");
    router.push(`/cards/${body!.card.id}/draft`);
  }
  return (
    <AppShellClient>
      <h1 className="text-2xl font-semibold">添加资料</h1>
      <div className="mt-6 rounded-lg border bg-white p-5">
        <div className="flex gap-2">
          {(["text", "image", "link"] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-sm ${tab === item ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
              {item === "text" ? "输入文本" : item === "image" ? "上传图片" : "粘贴链接"}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium">模板</label>
        <Select className="mt-2 max-w-xs" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        {tab === "text" && (
          <form action={submitText} className="mt-5 space-y-4">
            <Textarea name="text" rows={10} placeholder="粘贴文本内容" required />
            <Button disabled={loading}>{loading ? loadingLabel : "生成卡片草稿"}</Button>
          </form>
        )}
        {tab === "image" && (
          <form action={submitImage} className="mt-5 space-y-4">
            <Input name="file" type="file" accept=".jpg,.jpeg,.png,.webp" required />
            <Button disabled={loading}>{loading ? loadingLabel : "上传并生成"}</Button>
          </form>
        )}
        {tab === "link" && (
          <form action={submitLink} className="mt-5 space-y-4">
            <Input name="url" type="url" placeholder="https://..." required />
            <Button disabled={loading}>{loading ? "阅读中..." : "生成链接卡片"}</Button>
            {loading && (
              <div className="rounded-md border bg-slate-50 px-4 py-3 text-sm">
                <p className="font-medium">阅读中...</p>
                <p className="mt-1 text-muted">{linkStages[linkStageIndex]}</p>
              </div>
            )}
          </form>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </AppShellClient>
  );
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
