"use client";

import Link from "next/link";
import { Archive, LayoutDashboard, PlusSquare, Settings, WalletCards } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle, useLanguage } from "@/components/language-provider";

export function AppShellClient({ children, userLabel }: { children: React.ReactNode; userLabel?: string | null }) {
  const { copy } = useLanguage();
  return (
    <div className="min-h-screen bg-[#111111] text-[#f3f3f1]">
      <header className="border-b border-[#2f2f2f] bg-[#151515]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span><span className="block leading-tight">Atlora</span><span className="block text-xs font-normal text-[#8f8f8a]">{copy.product.subtitle}</span></span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-[#b4b4b1]">
            <Link href="/dashboard" className="inline-flex items-center rounded-md px-3 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"><LayoutDashboard className="mr-2 inline h-4 w-4" />{copy.navigation.library}</Link>
            <Link href="/new" className="inline-flex items-center rounded-md px-3 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"><PlusSquare className="mr-2 inline h-4 w-4" />{copy.navigation.newMaterial}</Link>
            <Link href="/usage" className="inline-flex items-center rounded-md px-3 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"><WalletCards className="mr-2 inline h-4 w-4" />{copy.navigation.usage}</Link>
            <Link href="/settings" className="inline-flex items-center rounded-md px-3 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"><Settings className="mr-2 inline h-4 w-4" />{copy.navigation.settings}</Link>
            <LanguageToggle />
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex items-center rounded-md px-3 py-2 text-[#8f8f8a] hover:bg-white/[0.06] hover:text-white"><Archive className="mr-2 inline h-4 w-4" />{copy.navigation.logout}{userLabel ? ` ${userLabel}` : ""}</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="spectral-surface min-h-[calc(100vh-73px)] px-4 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
