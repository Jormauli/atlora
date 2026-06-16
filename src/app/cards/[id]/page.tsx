import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CardEditor } from "@/components/card-editor";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Card } from "@prisma/client";
import type { SerializableCard } from "@/lib/types";

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: user.id, status: { not: "deleted" } } });
  if (!card) notFound();
  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-2xl font-semibold">{card.title}</h1>
          <p className="mt-3 text-muted">{card.summary}</p>
          <CardEditor card={serialize(card)} />
        </div>
        <aside className="rounded-lg border bg-white p-5 text-sm">
          <Info label="分类" value={card.category} />
          <Info label="标签" value={(card.tags as string[]).join("、") || "-"} />
          <Info label="卡片类型" value={card.cardType} />
          <Info label="分析视角" value={card.perspective} />
          <Info label="来源类型" value={card.sourceType} />
          <Info label="来源链接" value={card.sourceUrl ?? "-"} />
          <Info label="来源标题" value={card.sourceTitle ?? "-"} />
          <Info label="创建时间" value={card.createdAt.toLocaleString("zh-CN")} />
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-4"><div className="text-muted">{label}</div><div className="mt-1 break-words">{value}</div></div>;
}

function serialize(card: Card): SerializableCard {
  return {
    ...card,
    keyPoints: card.keyPoints as string[],
    actionItems: card.actionItems as string[],
    frameworkStructure: (card.frameworkStructure as string[] | null) ?? [],
    criticalEvidence: (card.criticalEvidence as string[] | null) ?? [],
    reusableInsights: (card.reusableInsights as string[] | null) ?? [],
    usedModels: (card.usedModels as string[] | null) ?? [],
    connections: (card.connections as string[] | null) ?? [],
    rolePerspectives: (card.rolePerspectives as string[] | null) ?? [],
    localizedContent: card.localizedContent as SerializableCard["localizedContent"],
    tags: card.tags as string[],
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
}
