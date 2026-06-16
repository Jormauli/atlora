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
      <span className={`flex h-full flex-col overflow-hidden rounded-md border bg-[#171d1a] p-4 shadow-[0_1px_0_rgba(0,0,0,0.2)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)] group-focus-visible:ring-2 group-focus-visible:ring-[#d9e7c6] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#101412] ${accent.card}`}>
        <span className="flex h-[64px] shrink-0 items-start gap-3 overflow-hidden">
          <PlanetGlyph />
          <span className="min-w-0">
            <span className={`block text-xs ${accent.text}`}>{card.category}</span>
            <span className="mt-1 block line-clamp-2 text-base font-semibold leading-snug text-[#f4f1e8]">{card.title}</span>
          </span>
        </span>
        <span className="mt-3 block h-[84px] shrink-0 overflow-hidden text-sm leading-6 text-[#c9c2b6]">
          <span className="line-clamp-3">{card.summary}</span>
        </span>
        <span className="mt-3 block h-[40px] shrink-0 overflow-hidden text-xs leading-5 text-[#a9b1a9]">
          {keyPoint.point ? <span className="line-clamp-2">轨道：{keyPoint.point}</span> : null}
        </span>
        <span className="mt-auto flex h-[34px] shrink-0 flex-nowrap items-center gap-1.5 overflow-hidden">
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="max-w-[96px] truncate rounded border border-[#354039] bg-[#202821] px-2 py-0.5 text-xs text-[#c9c2b6]">
              {tag}
            </span>
          ))}
          <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#354039] text-[#c9c2b6] group-hover:bg-[#263126] group-hover:text-[#d9e7c6]">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </span>
    </button>
  );
}

function viewAccentClasses(tone: string) {
  const classes: Record<string, { card: string; text: string }> = {
    amber: { card: "border-[#5d4b28] group-hover:border-[#b9944d]", text: "text-[#d8bd82]" },
    sky: { card: "border-[#2e5260] group-hover:border-[#70a9bd]", text: "text-[#9cc8d6]" },
    emerald: { card: "border-[#355a40] group-hover:border-[#78aa80]", text: "text-[#9fcaa3]" },
    violet: { card: "border-[#4d4266] group-hover:border-[#9d8cc8]", text: "text-[#c4b7e6]" },
    blue: { card: "border-[#324c70] group-hover:border-[#7fa5d8]", text: "text-[#a9c4e8]" },
    indigo: { card: "border-[#414a78] group-hover:border-[#8f9ee0]", text: "text-[#b9c3f2]" },
    rose: { card: "border-[#69404c] group-hover:border-[#cf8798]", text: "text-[#e0aab7]" },
    slate: { card: "border-[#2d3833] group-hover:border-[#6d8662]", text: "text-[#9ba79d]" }
  };
  return classes[tone] ?? classes.slate;
}
