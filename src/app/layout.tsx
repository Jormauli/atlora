import type { Metadata } from "next";
import { headers } from "next/headers";
import { LanguageProvider } from "@/components/language-provider";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialLanguage = headers().get("x-atlora-locale") === "en" ? "en" : "zh";

  return (
    <html lang={initialLanguage === "en" ? "en" : "zh-CN"}>
      <body><LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider></body>
    </html>
  );
}
