"use client";

import { useLanguage } from "@/components/language-provider";
import { localizedContentViewLabel } from "@/lib/language";

export function SettingsContent({
  email,
  defaultPerspective,
  ocrQuota
}: {
  email: string;
  defaultPerspective: string | null;
  ocrQuota: {
    used: number;
    quota: number;
    remaining: number;
    warningThreshold: number;
    criticalThreshold: number;
    status: "ok" | "warning" | "critical";
    message: string | null;
  };
}) {
  const { copy } = useLanguage();
  const settingsCopy = copy.settings;
  return (
    <>
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">{settingsCopy.eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold">{settingsCopy.title}</h1>
        <p className="mt-1 text-sm text-[#b9b1a3]">{settingsCopy.description}</p>
      </header>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#9ba79d]">{settingsCopy.email}</p>
          <p className="mt-2 break-words text-lg font-medium text-[#f4f1e8]">{email}</p>
        </div>
        <div className="rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#9ba79d]">{settingsCopy.defaultView}</p>
          <p className="mt-2 text-lg font-medium text-[#f4f1e8]">{formatPerspective(defaultPerspective, settingsCopy.unset, copy)}</p>
        </div>
      </section>
      <section className="mt-4 rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#9ba79d]">{settingsCopy.ocrReminder}</p>
            <p className="mt-2 text-2xl font-semibold text-[#f4f1e8]">{settingsCopy.usedThisMonth} {ocrQuota.used} / {ocrQuota.quota} {settingsCopy.times}</p>
          </div>
          <div className="rounded-full border border-[#354039] px-3 py-1 text-sm text-[#c9c2b6]">{settingsCopy.remaining} {ocrQuota.remaining} {settingsCopy.times}</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#29302d]">
          <div className="h-full bg-[#d9e7c6]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b9b1a3]">
          {settingsCopy.threshold.replace("{warning}", String(ocrQuota.warningThreshold)).replace("{critical}", String(ocrQuota.criticalThreshold))}
        </p>
        {ocrQuota.status !== "ok" ? (
          <p className="mt-3 text-sm font-medium text-[#ead292]">
            {(ocrQuota.status === "critical" ? settingsCopy.criticalMessage : settingsCopy.warningMessage)
              .replace("{used}", String(ocrQuota.used))
              .replace("{quota}", String(ocrQuota.quota))}
          </p>
        ) : null}
      </section>
    </>
  );
}

function formatPerspective(value: string | null | undefined, fallback: string, copy: ReturnType<typeof useLanguage>["copy"]) {
  if (!value) return fallback;
  return value.split("|").filter(Boolean).map((item) => localizedContentViewLabel(item, copy)).join(" / ") || fallback;
}
