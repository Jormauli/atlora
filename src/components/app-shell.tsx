import Link from "next/link";
import { Archive, LayoutDashboard, PlusSquare, Settings, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">AI 素材箱</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-slate-100"><LayoutDashboard className="mr-2 inline h-4 w-4" />知识库</Link>
            <Link href="/new" className="rounded-md px-3 py-2 hover:bg-slate-100"><PlusSquare className="mr-2 inline h-4 w-4" />添加资料</Link>
            <Link href="/usage" className="rounded-md px-3 py-2 hover:bg-slate-100"><WalletCards className="mr-2 inline h-4 w-4" />用量</Link>
            <Link href="/settings" className="rounded-md px-3 py-2 hover:bg-slate-100"><Settings className="mr-2 inline h-4 w-4" />设置</Link>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100">
                <Archive className="mr-2 inline h-4 w-4" />退出 {user?.nickname ?? user?.email}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
