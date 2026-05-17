import { prisma } from "@/lib/db/prisma";

export interface OCRQuotaSummary {
  used: number;
  quota: number;
  remaining: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: "ok" | "warning" | "critical";
  message: string | null;
}

export async function getMonthlyOCRQuotaSummary(userId: string, now = new Date()): Promise<OCRQuotaSummary> {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const aggregate = await prisma.usageLedger.aggregate({
    where: {
      userId,
      usageType: "ocr",
      createdAt: { gte: startOfMonth, lt: startOfNextMonth }
    },
    _sum: { quantity: true }
  });
  const used = aggregate._sum.quantity ?? 0;
  const quota = Number(process.env.OCR_MONTHLY_FREE_QUOTA ?? 1000);
  const warningThreshold = Number(process.env.OCR_USAGE_WARNING_THRESHOLD ?? 800);
  const criticalThreshold = Number(process.env.OCR_USAGE_CRITICAL_THRESHOLD ?? 950);
  const remaining = Math.max(0, quota - used);
  const status = used >= criticalThreshold ? "critical" : used >= warningThreshold ? "warning" : "ok";
  const message =
    status === "critical"
      ? `本月 OCR 已使用 ${used}/${quota} 次，接近或达到免费额度。`
      : status === "warning"
        ? `本月 OCR 已使用 ${used}/${quota} 次，建议关注剩余额度。`
        : null;
  return { used, quota, remaining, warningThreshold, criticalThreshold, status, message };
}
