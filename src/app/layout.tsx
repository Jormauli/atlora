import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 素材箱",
  description: "本地运行的 AI 知识卡片生成工具"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
