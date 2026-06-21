import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsContent } from "@/components/settings-content";
import { getCurrentUser } from "@/lib/auth/session";
import { getMonthlyOCRQuotaSummary } from "@/lib/services/usage/ocr-quota";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ocrQuota = await getMonthlyOCRQuotaSummary(user.id);
  return (
    <AppShell>
      <SettingsContent
        email={user.email}
        defaultPerspective={user.profile?.defaultPerspective ?? null}
        ocrQuota={ocrQuota}
      />
    </AppShell>
  );
}
