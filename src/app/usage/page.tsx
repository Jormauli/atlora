import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UsageContent } from "@/components/usage-content";
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
      <UsageContent
        usage={usage.map((item) => ({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
          usageType: item.usageType,
          taskType: item.taskType,
          modelTier: item.modelTier,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens
        }))}
        ocrQuota={ocrQuota}
      />
    </AppShell>
  );
}
