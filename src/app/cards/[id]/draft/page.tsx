import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CardEditor } from "@/components/card-editor";
import type { Card } from "@prisma/client";
import type { SerializableCard } from "@/lib/types";

export default async function DraftPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const card = await prisma.card.findFirst({ where: { id: params.id, userId: user.id, status: "draft" } });
  if (!card) notFound();
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">确认卡片草稿</h1>
      <CardEditor card={serialize(card)} draft />
    </AppShell>
  );
}

function serialize(card: Card): SerializableCard {
  return {
    ...card,
    keyPoints: card.keyPoints as string[],
    actionItems: card.actionItems as string[],
    tags: card.tags as string[],
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
}
