import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { getMonthlyOCRQuotaSummary } from "@/lib/services/usage/ocr-quota";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ocrQuota = await getMonthlyOCRQuotaSummary(user.id);
  return (
    <AppShell>
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">atlora / settings</div>
        <h1 className="mt-1 text-2xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-[#b9b1a3]">管理账号信息和默认观测参数</p>
      </header>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#9ba79d]">邮箱</p>
          <p className="mt-2 break-words text-lg font-medium text-[#f4f1e8]">{user.email}</p>
        </div>
        <div className="rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
          <p className="text-sm text-[#9ba79d]">当前默认视角</p>
          <p className="mt-2 text-lg font-medium text-[#f4f1e8]">{formatPerspective(user.profile?.defaultPerspective)}</p>
        </div>
      </section>
      <section className="mt-4 rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#9ba79d]">OCR 提醒</p>
            <p className="mt-2 text-2xl font-semibold text-[#f4f1e8]">本月已用 {ocrQuota.used} / {ocrQuota.quota} 次</p>
          </div>
          <div className="rounded-full border border-[#354039] px-3 py-1 text-sm text-[#c9c2b6]">剩余 {ocrQuota.remaining} 次</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#29302d]">
          <div className="h-full bg-[#d9e7c6]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b9b1a3]">
          达到 {ocrQuota.warningThreshold} 次时提醒，达到 {ocrQuota.criticalThreshold} 次时高优先级提醒。
        </p>
        {ocrQuota.message && <p className="mt-3 text-sm font-medium text-[#ead292]">{ocrQuota.message}</p>}
      </section>
    </AppShell>
  );
}

function formatPerspective(value: string | null | undefined) {
  if (!value) return "未设置";
  return value.split("|").filter(Boolean).join(" / ") || "未设置";
}
