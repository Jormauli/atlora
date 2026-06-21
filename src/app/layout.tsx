import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.productLabel,
  description: brand.description
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
