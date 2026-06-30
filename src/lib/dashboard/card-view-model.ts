import { contentViews, fallbackContentView, findContentView } from "@/lib/content-views";
import type { SerializedKnowledgeConcept, SerializedRelatedCard } from "@/lib/services/knowledge-graph/types";
import type { LocalizedCardContent } from "@/lib/types";

export interface DashboardCard {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  rolePerspectives: string[];
  localizedContent?: LocalizedCardContent | null;
  tags: string[];
  category: string;
  cardType: string;
  perspective: string;
  sourceType: "image" | "text" | "link";
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceDomain: string | null;
  knowledgeConcepts: SerializedKnowledgeConcept[];
  relatedCards: SerializedRelatedCard[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleFilter {
  id: string;
  label: string;
  count: number;
  tone: string;
}

export type DashboardSort = "desc" | "asc";

export interface DashboardCardFilterInput {
  query: string;
  selectedRoleIds: string[];
  activeTag: string;
  sort: DashboardSort;
}

const perspectiveLabels: Record<string, string> = {
  connection: fallbackContentView.label,
  general: fallbackContentView.label,
  creator: "爆款好文",
  founder: "市场研究",
  investment: "投资理财",
  tools: "工具/技能",
  learning: "知识点",
  investment_finance: "投资理财",
  market_research: "市场研究",
  tool_skill: "工具/技能",
  personal_growth: "个人成长",
  news: "新闻资讯",
  knowledge: "知识点",
  viral_article: "爆款好文",
  general_content: fallbackContentView.label
};

const cardTypeLabels: Record<string, string> = {
  general_summary: fallbackContentView.label,
  content_creator: "爆款好文",
  startup_product: "市场研究",
  investment_info: "投资理财",
  tool_app: "工具/技能",
  learning_note: "知识点",
  investment_finance: "投资理财",
  market_research: "市场研究",
  tool_skill: "工具/技能",
  personal_growth: "个人成长",
  news: "新闻资讯",
  knowledge: "知识点",
  viral_article: "爆款好文",
  general_content: fallbackContentView.label
};

export function buildCardFilters(cards: DashboardCard[]) {
  const roleCounts = new Map<string, { id: string; label: string; count: number }>();
  const tags: string[] = [];
  const seenTags = new Set<string>();

  for (const card of cards) {
    const label = primaryRoleLabelFromCard(card);
    const id = roleIdFromLabel(label);
    const existing = roleCounts.get(id);
    if (existing) existing.count += 1;
    else roleCounts.set(id, { id, label, count: 1 });

    for (const tag of card.tags) {
      if (seenTags.has(tag)) continue;
      seenTags.add(tag);
      tags.push(tag);
    }
  }

  const canonicalViews = [...contentViews.map((view) => view.label), fallbackContentView.label];
  const roles = canonicalViews
    .map((label) => {
      const role = roleCounts.get(roleIdFromLabel(label));
      return {
        id: roleIdFromLabel(label),
        label,
        count: role?.count ?? 0,
        tone: findContentView(label)?.tone ?? "stone"
      };
    });

  return {
    roles: [{ id: "all", label: "全部", count: cards.length, tone: "slate" }, ...roles],
    tags
  };
}

export function roleLabelsFromCard(card: DashboardCard) {
  const labels = [
    roleLabelFromPerspective(card.perspective, card.cardType),
    ...card.rolePerspectives.map((perspective) => normalizeRoleLabel(extractPerspectiveRole(perspective)))
  ].filter(Boolean);
  return Array.from(new Set(labels));
}

export function primaryRoleLabelFromCard(card: DashboardCard) {
  return roleLabelFromPerspective(card.perspective, card.cardType);
}

export function roleLabelFromPerspective(perspective: string, cardType: string) {
  return perspectiveLabels[perspective] ?? cardTypeLabels[cardType] ?? "通用";
}

export function roleIdFromLabel(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

export function parseKeyPoint(value: string) {
  const normalized = value.trim();
  const delimiter = normalized.includes("｜论据：")
    ? "｜论据："
    : normalized.includes("|论据：")
      ? "|论据："
      : normalized.includes("| Evidence:")
        ? "| Evidence:"
        : "";
  if (!delimiter) return { point: removePointPrefix(normalized), evidence: "" };

  const [point, evidence] = normalized.split(delimiter);
  return {
    point: removePointPrefix(point),
    evidence: evidence?.trim() ?? ""
  };
}

export function filterDashboardCards(cards: DashboardCard[], filters: DashboardCardFilterInput) {
  const keyword = filters.query.trim().toLowerCase();

  return cards
    .filter((card) => {
      const cardRoleIds = [roleIdFromLabel(primaryRoleLabelFromCard(card))];
      if (
        !filters.selectedRoleIds.includes("all") &&
        !filters.selectedRoleIds.some((roleId) => cardRoleIds.includes(roleId))
      ) {
        return false;
      }

      if (filters.activeTag && !card.tags.includes(filters.activeTag)) return false;
      if (!keyword) return true;

      return [
        card.title,
        card.summary,
        card.sourceTitle ?? "",
        card.tags.join(" "),
        card.knowledgeConcepts.map((concept) => concept.name).join(" ")
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    })
    .sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return filters.sort === "desc" ? right - left : left - right;
    });
}

export function filterRolePerspectives(perspectives: string[], selectedRoleLabels: string[]) {
  if (!selectedRoleLabels.length || selectedRoleLabels.includes("all") || selectedRoleLabels.includes("全部")) {
    return perspectives;
  }

  return perspectives.filter((perspective) => {
    const role = normalizeRoleLabel(extractPerspectiveRole(perspective));
    if (!role) return false;
    return selectedRoleLabels.includes(role);
  });
}

function extractPerspectiveRole(value: string) {
  const normalized = value.trim();
  const viewSection = normalized.match(/^【(.+?)】/);
  if (viewSection?.[1]) return viewSection[1].trim();
  const explicit = normalized.match(/^对\s*(.+?)\s*的启示[：:]/);
  if (explicit?.[1]) return explicit[1].trim();
  const colonRole = normalized.match(/^(.+?)[：:]/);
  return colonRole?.[1]?.replace(/^角色\s*[：:]\s*/, "").trim() ?? "";
}

function normalizeRoleLabel(rawRole: string) {
  const role = rawRole.replace(/\s+/g, " ").trim();
  if (!role) return "";
  const view = findContentView(role);
  if (view) return view.label;
  if (role.includes("投资") || role.includes("理财")) return "投资理财";
  if (role.includes("市场") || role.includes("行业") || role.includes("商业")) return "市场研究";
  if (role.includes("工具") || role.includes("技能")) return "工具/技能";
  if (role.includes("成长") || role.includes("职场") || role.includes("习惯")) return "个人成长";
  if (role.includes("新闻") || role.includes("资讯")) return "新闻资讯";
  if (role.includes("知识") || role.includes("学习") || role.includes("学生")) return "知识点";
  if (role.includes("爆款") || role.includes("创作者") || role.includes("内容")) return "爆款好文";
  return fallbackContentView.label;
}

function removePointPrefix(value: string) {
  return value.replace(/^观点[:：]\s*/, "").replace(/^Point:\s*/i, "").trim();
}
