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
      <h1 className="text-2xl font-semibold">设置</h1>
      <section className="mt-6 rounded-lg border bg-white p-5">
        <p className="text-sm text-muted">邮箱</p>
        <p className="mt-1">{user.email}</p>
        <p className="mt-5 text-sm text-muted">当前默认视角</p>
        <p className="mt-1">{user.profile?.defaultPerspective ?? "未设置"}</p>
      </section>
      <section className="mt-4 rounded-lg border bg-white p-5">
        <p className="text-sm text-muted">OCR 提醒</p>
        <p className="mt-1">本月已用 {ocrQuota.used} / {ocrQuota.quota} 次</p>
        <p className="mt-2 text-sm text-muted">
          达到 {ocrQuota.warningThreshold} 次时提醒，达到 {ocrQuota.criticalThreshold} 次时高优先级提醒。
        </p>
        {ocrQuota.message && <p className="mt-3 text-sm font-medium text-amber-700">{ocrQuota.message}</p>}
      </section>
    </AppShell>
  );
}
