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
        <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">{usageCopy.eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold">{usageCopy.title}</h1>
        <p className="mt-1 text-sm text-[#b9b1a3]">{usageCopy.description}</p>
      </header>
      <section className="mt-6 rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#9ba79d]">{usageCopy.monthlyOcr}</p>
            <p className="mt-1 text-3xl font-semibold text-[#f4f1e8]">{ocrQuota.used} / {ocrQuota.quota}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm ${
            ocrQuota.status === "critical"
              ? "bg-[#3b1f1f] text-[#f3b4ac]"
              : ocrQuota.status === "warning"
                ? "bg-[#3b321d] text-[#ead292]"
                : "bg-[#203527] text-[#a9d7af]"
          }`}>
            {ocrQuota.status === "critical" ? usageCopy.critical : ocrQuota.status === "warning" ? usageCopy.warning : usageCopy.ok}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#29302d]">
          <div className="h-full bg-[#d9e7c6]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b9b1a3]">{usageCopy.remaining} {ocrQuota.remaining}. {usageCopy.threshold}: {ocrQuota.warningThreshold} / {ocrQuota.criticalThreshold}</p>
        {ocrQuota.status !== "ok" ? (
          <p className="mt-3 text-sm font-medium text-[#ead292]">
            {(ocrQuota.status === "critical" ? usageCopy.criticalMessage : usageCopy.warningMessage)
              .replace("{used}", String(ocrQuota.used))
              .replace("{quota}", String(ocrQuota.quota))}
          </p>
        ) : null}
      </section>
      <div className="mt-6 overflow-hidden rounded-md border border-[#354039] bg-[#171d1a]">
        <table className="w-full text-left text-sm text-[#d8d2c6]">
          <thead className="bg-[#101412] text-[#9ba79d]">
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
              <tr key={item.id} className="border-t border-[#29302d]">
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
                <td className="p-6 text-center text-[#9ba79d]" colSpan={6}>{usageCopy.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
