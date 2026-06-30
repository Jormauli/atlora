import type { MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { parseKeyPoint, type DashboardCard } from "@/lib/dashboard/card-view-model";
import { findContentView } from "@/lib/content-views";
import { PlanetGlyph } from "./planet-glyph";

export function KnowledgeCard({
  card,
  onOpen
}: {
  card: DashboardCard;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const keyPoint = parseKeyPoint(card.keyPoints[0] ?? "");
  const accent = viewAccentClasses(findContentView(card.perspective)?.tone ?? findContentView(card.cardType)?.tone ?? "slate");

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`观测 ${card.title}`}
      className="group h-[278px] w-full text-left outline-none"
    >
      <span className={`flex h-full flex-col overflow-hidden rounded-md border bg-[#171717] p-4 shadow-[0_1px_0_rgba(0,0,0,0.22)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(0,0,0,0.3)] group-focus-visible:ring-2 group-focus-visible:ring-[#4f6f8f] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#111111] ${accent.card}`}>
        <span className="flex h-[64px] shrink-0 items-start gap-3 overflow-hidden">
          <PlanetGlyph />
          <span className="min-w-0">
            <span className={`block text-xs ${accent.text}`}>{card.category}</span>
            <span className="mt-1 block line-clamp-2 text-base font-semibold leading-snug text-[#f3f3f1]">{card.title}</span>
          </span>
        </span>
        <span className="mt-3 block h-[84px] shrink-0 overflow-hidden text-sm leading-6 text-[#d8d8d5]">
          <span className="line-clamp-3">{card.summary}</span>
        </span>
        <span className="mt-3 block h-[40px] shrink-0 overflow-hidden text-xs leading-5 text-[#8f8f8a]">
          {keyPoint.point ? <span className="line-clamp-2">轨道：{keyPoint.point}</span> : null}
        </span>
        <span className="mt-auto flex h-[34px] shrink-0 flex-nowrap items-center gap-1.5 overflow-hidden">
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="max-w-[96px] truncate rounded border border-[#2f2f2f] bg-[#242424] px-2 py-0.5 text-xs text-[#b4b4b1]">
              {tag}
            </span>
          ))}
          <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#3a3a3a] text-[#b4b4b1] group-hover:bg-[#242424] group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </span>
    </button>
  );
}

function viewAccentClasses(tone: string) {
  const classes: Record<string, { card: string; text: string }> = {
    amber: { card: "border-[#2f2f2f] border-t-[#b48745] group-hover:border-t-[#b48745]", text: "text-[#d7b56d]" },
    sky: { card: "border-[#2f2f2f] border-t-[#4f6f8f] group-hover:border-t-[#4f6f8f]", text: "text-[#8fb1d1]" },
    emerald: { card: "border-[#2f2f2f] border-t-[#5f8f72] group-hover:border-t-[#5f8f72]", text: "text-[#9cc8a6]" },
    violet: { card: "border-[#2f2f2f] border-t-[#8f7db8] group-hover:border-t-[#8f7db8]", text: "text-[#c4b7e6]" },
    blue: { card: "border-[#2f2f2f] border-t-[#4f6f8f] group-hover:border-t-[#4f6f8f]", text: "text-[#9eb8d5]" },
    indigo: { card: "border-[#2f2f2f] border-t-[#7480b8] group-hover:border-t-[#7480b8]", text: "text-[#b9c3f2]" },
    rose: { card: "border-[#2f2f2f] border-t-[#9a554b] group-hover:border-t-[#9a554b]", text: "text-[#d79a92]" },
    slate: { card: "border-[#2f2f2f] border-t-[#8f8f8a] group-hover:border-t-[#8f8f8a]", text: "text-[#b4b4b1]" }
  };
  return classes[tone] ?? classes.slate;
}
