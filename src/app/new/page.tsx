"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, LinkIcon } from "lucide-react";
import { AppShellClient } from "@/components/app-shell-client";
import { useLanguage } from "@/components/language-provider";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { readJsonSafely } from "@/lib/client/http";
import { contentViews } from "@/lib/content-views";
import { localizedContentViewLabel } from "@/lib/language";

export default function NewPage() {
  return (
    <AppShellClient>
      <NewMaterialContent />
    </AppShellClient>
  );
}

function NewMaterialContent() {
  const router = useRouter();
  const { copy } = useLanguage();
  const [tab, setTab] = useState<"text" | "image" | "link">("text");
  const [templateId, setTemplateId] = useState("auto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const templates = [
    ["auto", copy.newMaterial.autoView],
    ...contentViews.map((view) => [`content_view__${view.id}`, localizedContentViewLabel(view.id, copy)])
  ];
  const stageSets = buildStageSets(copy);

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
    await submit("/api/ingestions/text", { text: formData.get("text"), templateId }, copy.newMaterial.generating);
  }
  async function submitLink(formData: FormData) {
    await submit("/api/ingestions/link", { url: formData.get("url"), templateId }, copy.newMaterial.reading);
  }
  async function submitImage(formData: FormData) {
    setLoading(true);
    setLoadingLabel(copy.newMaterial.recognizing);
    setError("");
    formData.set("templateId", templateId);
    const response = await fetch("/api/ingestions/image", { method: "POST", body: formData });
    const body = await readJsonSafely(response);
    setLoading(false);
    setLoadingLabel("");
    if (!response.ok) return setError(errorAdvice("image", copy, body?.error));
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
    if (!response.ok) return setError(errorAdvice(tab, copy, body?.error));
    router.push(`/cards/${body!.card.id}/draft`);
  }
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">{copy.newMaterial.eyebrow}</div>
          <h1 className="mt-1 text-2xl font-semibold">{copy.newMaterial.title}</h1>
          <p className="mt-1 text-sm text-[#b9b1a3]">{copy.newMaterial.description}</p>
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
              {item === "text" ? copy.newMaterial.textTab : item === "image" ? copy.newMaterial.imageTab : copy.newMaterial.linkTab}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-[#d8d2c6]">{copy.newMaterial.viewLabel}</label>
        <Select className="mt-2 max-w-xs border-[#354039] bg-[#101412] text-[#f4f1e8] focus:ring-[#d9e7c6]" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        {tab === "text" && (
          <form action={submitText} className="mt-5 space-y-4">
            <Textarea name="text" rows={10} placeholder={copy.newMaterial.textPlaceholder} required className="border-[#354039] bg-[#101412] text-[#f4f1e8] placeholder:text-[#7f897f] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? loadingLabel : copy.newMaterial.generateDraft}</Button>
            {loading ? <LoadingProgress stages={stageSets.text} elapsedMs={loadingElapsedMs} waitedLabel={copy.newMaterial.stages.waited} /> : null}
          </form>
        )}
        {tab === "image" && (
          <form action={submitImage} className="mt-5 space-y-4">
            <Input name="file" type="file" accept=".jpg,.jpeg,.png,.webp" required className="border-[#354039] bg-[#101412] text-[#f4f1e8] file:mr-3 file:rounded file:border-0 file:bg-[#d9e7c6] file:px-3 file:py-1 file:text-sm file:text-[#172018] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? loadingLabel : copy.newMaterial.uploadGenerate}</Button>
            {loading ? <LoadingProgress stages={stageSets.image} elapsedMs={loadingElapsedMs} waitedLabel={copy.newMaterial.stages.waited} /> : null}
          </form>
        )}
        {tab === "link" && (
          <form action={submitLink} className="mt-5 space-y-4">
            <Input name="url" type="url" placeholder={copy.newMaterial.urlPlaceholder} required className="border-[#354039] bg-[#101412] text-[#f4f1e8] placeholder:text-[#7f897f] focus:ring-[#d9e7c6]" />
            <Button disabled={loading} className="bg-[#d9e7c6] text-[#172018] hover:bg-[#c7dab0]">{loading ? copy.newMaterial.reading : copy.newMaterial.generateLink}</Button>
            {loading ? <LoadingProgress stages={stageSets.link} elapsedMs={loadingElapsedMs} waitedLabel={copy.newMaterial.stages.waited} /> : null}
          </form>
        )}
        {error && <p className="mt-4 rounded-md border border-[#6b3b3b] bg-[#261717] px-3 py-2 text-sm text-[#f0c8c8]">{error}</p>}
      </div>
    </>
  );
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

type LoadingStage = { label: string; detail: string; afterMs: number };

function LoadingProgress({ stages, elapsedMs, waitedLabel }: { stages: LoadingStage[]; elapsedMs: number; waitedLabel: string }) {
  const activeStageIndex = findActiveStageIndex(stages, elapsedMs);
  const activeStage = stages[activeStageIndex];
  const progress = Math.min(92, 12 + activeStageIndex * 24 + elapsedMs / 1400);

  return (
    <div className="rounded-md border border-[#354039] bg-[#101412] px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-[#f4f1e8]">{activeStage.label}</p>
        <p className="text-xs text-[#9ba79d]">{waitedLabel} {Math.max(1, Math.ceil(elapsedMs / 1000))}s</p>
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

function findActiveStageIndex(stages: LoadingStage[], elapsedMs: number) {
  for (let index = stages.length - 1; index >= 0; index -= 1) {
    if (elapsedMs >= stages[index].afterMs) return index;
  }
  return 0;
}

function errorAdvice(kind: "text" | "image" | "link", copy: ReturnType<typeof useLanguage>["copy"], message?: string) {
  const prefix = message || copy.newMaterial.generateFailed;
  return `${prefix} ${copy.newMaterial.advice[kind]}`;
}

function buildStageSets(copy: ReturnType<typeof useLanguage>["copy"]) {
  return {
    text: [
      { label: copy.newMaterial.stages.textRead, detail: copy.newMaterial.stages.textReadDetail, afterMs: 0 },
      { label: copy.newMaterial.stages.viewMatch, detail: copy.newMaterial.stages.viewMatchDetail, afterMs: 1200 },
      { label: copy.newMaterial.stages.cardGenerate, detail: copy.newMaterial.stages.cardGenerateDetail, afterMs: 3500 }
    ],
    image: [
      { label: copy.newMaterial.stages.imageUpload, detail: copy.newMaterial.stages.imageUploadDetail, afterMs: 0 },
      { label: copy.newMaterial.stages.imageOcr, detail: copy.newMaterial.stages.imageOcrDetail, afterMs: 1500 },
      { label: copy.newMaterial.stages.cardGenerate, detail: copy.newMaterial.stages.imageCardDetail, afterMs: 4500 }
    ],
    link: [
      { label: copy.newMaterial.stages.linkOpen, detail: copy.newMaterial.stages.linkOpenDetail, afterMs: 0 },
      { label: copy.newMaterial.stages.linkExtract, detail: copy.newMaterial.stages.linkExtractDetail, afterMs: 3500 },
      { label: copy.newMaterial.stages.linkFallback, detail: copy.newMaterial.stages.linkFallbackDetail, afterMs: 10000 },
      { label: copy.newMaterial.stages.cardGenerate, detail: copy.newMaterial.stages.linkCardDetail, afterMs: 18000 }
    ]
  };
}
