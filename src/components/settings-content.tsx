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
        <div className="text-xs uppercase tracking-[0.16em] text-[#8f8f8a]">{settingsCopy.eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold">{settingsCopy.title}</h1>
        <p className="mt-1 text-sm text-[#b4b4b1]">{settingsCopy.description}</p>
      </header>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[#2f2f2f] bg-[#171717] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#8f8f8a]">{settingsCopy.email}</p>
          <p className="mt-2 break-words text-lg font-medium text-[#f3f3f1]">{email}</p>
        </div>
        <div className="rounded-md border border-[#2f2f2f] bg-[#171717] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#8f8f8a]">{settingsCopy.defaultView}</p>
          <p className="mt-2 text-lg font-medium text-[#f3f3f1]">{formatPerspective(defaultPerspective, settingsCopy.unset, copy)}</p>
        </div>
      </section>
      <section className="mt-4 rounded-md border border-[#2f2f2f] bg-[#171717] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#8f8f8a]">{settingsCopy.ocrReminder}</p>
            <p className="mt-2 text-2xl font-semibold text-[#f3f3f1]">{settingsCopy.usedThisMonth} {ocrQuota.used} / {ocrQuota.quota} {settingsCopy.times}</p>
          </div>
          <div className="inline-flex items-center justify-center rounded-full border border-[#2f2f2f] px-3 py-1 text-sm leading-none text-[#d8d8d5]">{settingsCopy.remaining} {ocrQuota.remaining} {settingsCopy.times}</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#242424]">
          <div className="h-full bg-[#4f6f8f]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b4b4b1]">
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
