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
      <header>
        <div className="text-xs uppercase tracking-[0.16em] text-[#9ba79d]">atlora / orbit usage</div>
        <h1 className="mt-1 text-2xl font-semibold">用量记录</h1>
        <p className="mt-1 text-sm text-[#b9b1a3]">查看本月识别额度和最近的模型调用轨迹</p>
      </header>
      <section className="mt-6 rounded-md border border-[#354039] bg-[#171d1a] p-5 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#9ba79d]">本月 OCR 用量</p>
            <p className="mt-1 text-3xl font-semibold text-[#f4f1e8]">{ocrQuota.used} / {ocrQuota.quota}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm ${
            ocrQuota.status === "critical"
              ? "bg-[#3b1f1f] text-[#f3b4ac]"
              : ocrQuota.status === "warning"
                ? "bg-[#3b321d] text-[#ead292]"
                : "bg-[#203527] text-[#a9d7af]"
          }`}>
            {ocrQuota.status === "critical" ? "接近上限" : ocrQuota.status === "warning" ? "需要关注" : "额度正常"}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-[#29302d]">
          <div className="h-full bg-[#d9e7c6]" style={{ width: `${Math.min(100, (ocrQuota.used / ocrQuota.quota) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-[#b9b1a3]">剩余 {ocrQuota.remaining} 次。提醒阈值：{ocrQuota.warningThreshold} / {ocrQuota.criticalThreshold}</p>
        {ocrQuota.message && <p className="mt-3 text-sm font-medium text-[#ead292]">{ocrQuota.message}</p>}
      </section>
      <div className="mt-6 overflow-hidden rounded-md border border-[#354039] bg-[#171d1a]">
        <table className="w-full text-left text-sm text-[#d8d2c6]">
          <thead className="bg-[#101412] text-[#9ba79d]">
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
              <tr key={item.id} className="border-t border-[#29302d]">
                <td className="p-3">{item.createdAt.toLocaleString("zh-CN")}</td>
                <td className="p-3">{item.usageType}</td>
                <td className="p-3">{item.taskType}</td>
                <td className="p-3">{item.modelTier}</td>
                <td className="p-3">{item.inputTokens}</td>
                <td className="p-3">{item.outputTokens}</td>
              </tr>
            ))}
            {usage.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-[#9ba79d]" colSpan={6}>暂无用量记录</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
