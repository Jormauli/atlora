"use client";

import Link from "next/link";
import { Archive, LayoutDashboard, PlusSquare, Settings, WalletCards } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle, useLanguage } from "@/components/language-provider";

export function AppShellClient({ children, userLabel }: { children: React.ReactNode; userLabel?: string | null }) {
  const { copy } = useLanguage();
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#111111] text-[#f3f3f1]">
      <header className="border-b border-[#2f2f2f] bg-[#151515]/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span><span className="block leading-tight">Atlora</span><span className="block text-xs font-normal text-[#8f8f8a]">{copy.product.subtitle}</span></span>
          </Link>
          <nav className="flex w-full min-w-0 flex-wrap items-center gap-1 text-sm text-[#b4b4b1] sm:w-auto sm:justify-end">
            <Link href="/dashboard" className="inline-flex items-center rounded-md px-2 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white sm:px-3"><LayoutDashboard className="mr-2 inline h-4 w-4 shrink-0" />{copy.navigation.library}</Link>
            <Link href="/new" className="inline-flex items-center rounded-md px-2 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white sm:px-3"><PlusSquare className="mr-2 inline h-4 w-4 shrink-0" />{copy.navigation.newMaterial}</Link>
            <Link href="/usage" className="inline-flex items-center rounded-md px-2 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white sm:px-3"><WalletCards className="mr-2 inline h-4 w-4 shrink-0" />{copy.navigation.usage}</Link>
            <Link href="/settings" className="inline-flex items-center rounded-md px-2 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white sm:px-3"><Settings className="mr-2 inline h-4 w-4 shrink-0" />{copy.navigation.settings}</Link>
            <LanguageToggle />
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex max-w-full items-center rounded-md px-2 py-2 text-[#8f8f8a] hover:bg-white/[0.06] hover:text-white sm:px-3">
                <Archive className="mr-2 inline h-4 w-4 shrink-0" />
                {copy.navigation.logout}
                {userLabel ? <span className="ml-1 max-w-[7rem] truncate">{userLabel}</span> : null}
              </button>
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
