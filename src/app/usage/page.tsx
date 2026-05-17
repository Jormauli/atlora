import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getMonthlyOCRQuotaSummary } from "@/lib/services/usage/ocr-quota";

export default async function UsagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const usage = await prisma.usageLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const ocrQuota = await getMonthlyOCRQuotaSummary(user.id);
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">用量记录</h1>
      <section className="mt-6 rounded-lg border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">本月 OCR 用量</p>
            <p className="mt-1 text-2xl font-semibold">{ocrQuota.used} / {ocrQuota.quota}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm ${
            ocrQuota.status === "critical"
              ? "bg-red-100 text-red-700"
              : ocrQuota.status === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}>
            {ocrQuota.status === "critical" ? "接近上限" : ocrQuota.status === "warning" ? "需要关注" : "额度正常"}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-slate-100">
          <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">剩余 {ocrQuota.remaining} 次。提醒阈值：{ocrQuota.warningThreshold} / {ocrQuota.criticalThreshold}</p>
        {ocrQuota.message && <p className="mt-3 text-sm font-medium text-amber-700">{ocrQuota.message}</p>}
      </section>
      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">时间</th>
              <th className="p-3">类型</th>
              <th className="p-3">任务</th>
              <th className="p-3">模型层级</th>
              <th className="p-3">输入</th>
              <th className="p-3">输出</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.createdAt.toLocaleString("zh-CN")}</td>
                <td className="p-3">{item.usageType}</td>
                <td className="p-3">{item.taskType}</td>
                <td className="p-3">{item.modelTier}</td>
                <td className="p-3">{item.inputTokens}</td>
                <td className="p-3">{item.outputTokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
