import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage({ searchParams }: { searchParams: { q?: string; type?: string; sort?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/onboarding");
  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      status: "saved",
      cardType: searchParams.type || undefined,
      OR: searchParams.q
        ? [{ title: { contains: searchParams.q, mode: "insensitive" } }, { summary: { contains: searchParams.q, mode: "insensitive" } }]
        : undefined
    },
    orderBy: { createdAt: searchParams.sort === "asc" ? "asc" : "desc" }
  });
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">知识库</h1>
          <p className="mt-1 text-sm text-muted">已保存 {cards.length} 张卡片</p>
        </div>
        <Link href="/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">添加资料</Link>
      </div>
      <form className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_160px]">
        <input name="q" defaultValue={searchParams.q} placeholder="搜索标题或摘要" className="h-10 rounded-md border bg-white px-3" />
        <select name="type" defaultValue={searchParams.type ?? ""} className="h-10 rounded-md border bg-white px-3">
          <option value="">全部类型</option>
          <option value="general_summary">普通摘要</option>
          <option value="content_creator">内容创作者</option>
          <option value="startup_product">创业 / 产品</option>
          <option value="investment_info">投资信息</option>
          <option value="tool_app">工具应用</option>
          <option value="learning_note">学习笔记</option>
        </select>
        <select name="sort" defaultValue={searchParams.sort ?? "desc"} className="h-10 rounded-md border bg-white px-3">
          <option value="desc">最新创建</option>
          <option value="asc">最早创建</option>
        </select>
      </form>
      <div className="mt-6 grid gap-4">
        {cards.map((card) => (
          <Link key={card.id} href={`/cards/${card.id}`} className="rounded-lg border bg-white p-5 shadow-sm hover:border-slate-300">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>{card.cardType}</span>
              <span>{card.sourceType}</span>
              <span>{card.createdAt.toLocaleDateString("zh-CN")}</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-muted">{card.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(card.tags as string[]).map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs">{tag}</span>)}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
