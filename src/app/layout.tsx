import type { Metadata } from "next";
import { headers } from "next/headers";
import { LanguageProvider } from "@/components/language-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: brand.productLabel,
    template: "%s"
  },
  description: brand.description
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLanguage = headers().get("x-atlora-locale") === "en" ? "en" : "zh";
  const user = await getCurrentUser();
  const analyticsUser = user ? { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() } : null;

  return (
    <html lang={initialLanguage === "en" ? "en" : "zh-CN"}>
      <body>
        <LanguageProvider initialLanguage={initialLanguage}>
          <PostHogProvider user={analyticsUser}>{children}</PostHogProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
