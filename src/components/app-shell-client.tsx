"use client";

import Link from "next/link";
import { Archive, LayoutDashboard, PlusSquare, Settings, WalletCards } from "lucide-react";
import { brand } from "@/lib/brand";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#101412] text-[#f4f1e8]">
      <header className="border-b border-[#29302d] bg-[#151918]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#66785f] bg-[#d9e7c6] text-[#26351f]">A</span>
            <span><span className="block leading-tight">Atlora</span><span className="block text-xs font-normal text-[#a9b1a9]">{brand.name.zh}</span></span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-[#c9c2b6]">
            <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-white/[0.06] hover:text-[#f4f1e8]"><LayoutDashboard className="mr-2 inline h-4 w-4" />{brand.navigation.library}</Link>
            <Link href="/new" className="rounded-md px-3 py-2 hover:bg-white/[0.06] hover:text-[#f4f1e8]"><PlusSquare className="mr-2 inline h-4 w-4" />添加资料</Link>
            <Link href="/usage" className="rounded-md px-3 py-2 hover:bg-white/[0.06] hover:text-[#f4f1e8]"><WalletCards className="mr-2 inline h-4 w-4" />用量</Link>
            <Link href="/settings" className="rounded-md px-3 py-2 hover:bg-white/[0.06] hover:text-[#f4f1e8]"><Settings className="mr-2 inline h-4 w-4" />设置</Link>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-md px-3 py-2 text-[#9ba79d] hover:bg-white/[0.06] hover:text-[#f4f1e8]"><Archive className="mr-2 inline h-4 w-4" />退出</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="starfield-surface min-h-[calc(100vh-73px)] px-4 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
