"use client";

import { useLanguage } from "@/components/language-provider";

export function UsageContent({
  usage,
  ocrQuota
}: {
  usage: Array<{
    id: string;
    createdAt: string;
    usageType: string;
    taskType: string;
    modelTier: string;
    inputTokens: number;
    outputTokens: number;
  }>;
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
  const { copy, language } = useLanguage();
  const usageCopy = copy.usage;
  return (
    <>
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-[#8f8f8a]">{usageCopy.eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold">{usageCopy.title}</h1>
        <p className="mt-1 text-sm text-[#b4b4b1]">{usageCopy.description}</p>
      </header>
      <section className="mt-6 rounded-md border border-[#2f2f2f] bg-[#171717] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#8f8f8a]">{usageCopy.monthlyOcr}</p>
            <p className="mt-1 text-3xl font-semibold text-[#f3f3f1]">{ocrQuota.used} / {ocrQuota.quota}</p>
          </div>
          <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm leading-none ${
            ocrQuota.status === "critical"
              ? "bg-[#3b1f1f] text-[#f3b4ac]"
              : ocrQuota.status === "warning"
                ? "bg-[#3b321d] text-[#ead292]"
                : "bg-[#203527] text-[#a9d7af]"
          }`}>
            {ocrQuota.status === "critical" ? usageCopy.critical : ocrQuota.status === "warning" ? usageCopy.warning : usageCopy.ok}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#242424]">
          <div className="h-full bg-[#4f6f8f]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b4b4b1]">{usageCopy.remaining} {ocrQuota.remaining}. {usageCopy.threshold}: {ocrQuota.warningThreshold} / {ocrQuota.criticalThreshold}</p>
        {ocrQuota.status !== "ok" ? (
          <p className="mt-3 text-sm font-medium text-[#ead292]">
            {(ocrQuota.status === "critical" ? usageCopy.criticalMessage : usageCopy.warningMessage)
              .replace("{used}", String(ocrQuota.used))
              .replace("{quota}", String(ocrQuota.quota))}
          </p>
        ) : null}
      </section>
      <div className="mt-6 overflow-hidden rounded-md border border-[#2f2f2f] bg-[#171717]">
        <table className="w-full text-left text-sm text-[#d8d8d5]">
          <thead className="bg-[#111111] text-[#8f8f8a]">
            <tr>
              <th className="p-3">{usageCopy.time}</th>
              <th className="p-3">{usageCopy.type}</th>
              <th className="p-3">{usageCopy.task}</th>
              <th className="p-3">{usageCopy.modelTier}</th>
              <th className="p-3">{usageCopy.input}</th>
              <th className="p-3">{usageCopy.output}</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((item) => (
              <tr key={item.id} className="border-t border-[#2f2f2f]">
                <td className="p-3">{new Date(item.createdAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}</td>
                <td className="p-3">{item.usageType}</td>
                <td className="p-3">{item.taskType}</td>
                <td className="p-3">{item.modelTier}</td>
                <td className="p-3">{item.inputTokens}</td>
                <td className="p-3">{item.outputTokens}</td>
              </tr>
            ))}
            {usage.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-[#8f8f8a]" colSpan={6}>{usageCopy.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
