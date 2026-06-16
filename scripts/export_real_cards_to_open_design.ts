import { readFile, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const projectDir =
  "/Users/Jorma/Library/Application Support/Open Design/namespaces/release-stable/data/projects/35ebcd06-787c-422a-a309-d58729894ba6";
const knowledgeBasePath = path.join(projectDir, "knowledge-base.html");

const prisma = new PrismaClient();

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function sourceLabel(sourceType: string, sourceDomain?: string | null) {
  if (sourceDomain?.includes("mp.weixin.qq.com") || sourceType === "link") return "微信";
  if (sourceType === "image") return "截图";
  if (sourceType === "text") return "文本";
  return sourceType;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "demo@example.com" } });
  if (!user) throw new Error("demo@example.com not found");

  const cards = await prisma.card.findMany({
    where: { userId: user.id, status: "saved" },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      summary: true,
      sourceType: true,
      sourceUrl: true,
      sourceDomain: true,
      tags: true,
      keyPoints: true,
      criticalEvidence: true,
      reusableInsights: true,
      usedModels: true,
      connections: true,
      rolePerspectives: true,
      frameworkStructure: true
    }
  });

  const exportedCards = cards.map((card) => {
    const tags = asStringArray(card.tags);
    const criticalEvidence = asStringArray(card.criticalEvidence);
    return {
      title: card.title,
      summary: card.summary,
      source: sourceLabel(card.sourceType, card.sourceDomain),
      sourceUrl: card.sourceUrl,
      tags,
      warn:
        card.title.includes("待读") ||
        tags.some((tag) => tag.includes("待验证") || tag.includes("待处理")) ||
        criticalEvidence.some((item) => item.includes("待验证")),
      keyPoints: asStringArray(card.keyPoints),
      criticalEvidence,
      reusableInsights: asStringArray(card.reusableInsights),
      usedModels: asStringArray(card.usedModels),
      connections: asStringArray(card.connections),
      rolePerspectives: asStringArray(card.rolePerspectives),
      frameworkStructure: asStringArray(card.frameworkStructure)
    };
  });

  const html = await readFile(knowledgeBasePath, "utf8");
  const nextHtml = html
    .replace(/const cards = \[[\s\S]*?\];/, `const cards = ${JSON.stringify(exportedCards, null, 6)};`)
    .replace(/<span class="chip">[^<]+<\/span><\/div>\s*<div class="panel-body">/, `<span class="chip">${exportedCards.length} 张</span></div>\n          <div class="panel-body">`);
  await writeFile(knowledgeBasePath, nextHtml);

  console.log(`Exported ${exportedCards.length} saved cards to ${knowledgeBasePath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
