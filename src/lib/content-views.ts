export const contentViews = [
  {
    id: "investment_finance",
    label: "投资理财",
    templateId: "content_view",
    perspective: "investment_finance",
    cardType: "investment_finance",
    sectionTitle: "投资行动参考",
    tone: "amber"
  },
  {
    id: "market_research",
    label: "市场研究",
    templateId: "content_view",
    perspective: "market_research",
    cardType: "market_research",
    sectionTitle: "商业情报提炼",
    tone: "sky"
  },
  {
    id: "tool_skill",
    label: "工具/技能",
    templateId: "content_view",
    perspective: "tool_skill",
    cardType: "tool_skill",
    sectionTitle: "实操工具箱",
    tone: "emerald"
  },
  {
    id: "personal_growth",
    label: "个人成长",
    templateId: "content_view",
    perspective: "personal_growth",
    cardType: "personal_growth",
    sectionTitle: "成长行动指南",
    tone: "violet"
  },
  {
    id: "news",
    label: "新闻资讯",
    templateId: "content_view",
    perspective: "news",
    cardType: "news",
    sectionTitle: "资讯评估卡",
    tone: "blue"
  },
  {
    id: "knowledge",
    label: "知识点",
    templateId: "content_view",
    perspective: "knowledge",
    cardType: "knowledge",
    sectionTitle: "学习知识卡",
    tone: "indigo"
  },
  {
    id: "viral_article",
    label: "爆款好文",
    templateId: "content_view",
    perspective: "viral_article",
    cardType: "viral_article",
    sectionTitle: "爆款拆解笔记",
    tone: "rose"
  }
] as const;

export const fallbackContentView = {
  id: "general_content",
  label: "通用内容",
  templateId: "content_view",
  perspective: "general_content",
  cardType: "general_content",
  sectionTitle: "通用信息卡",
  tone: "slate"
} as const;

export type ContentViewId = (typeof contentViews)[number]["id"] | typeof fallbackContentView.id;

export function findContentView(idOrLabel: string | null | undefined) {
  if (!idOrLabel) return null;
  return [...contentViews, fallbackContentView].find((view) => (
    view.id === idOrLabel ||
    view.label === idOrLabel ||
    view.perspective === idOrLabel ||
    view.cardType === idOrLabel
  )) ?? null;
}

export function parseSelectedContentViews(value: string | null | undefined) {
  const ids = (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => findContentView(item)?.id)
    .filter((id): id is ContentViewId => Boolean(id) && id !== fallbackContentView.id);

  return Array.from(new Set(ids));
}

export function encodeSelectedContentViews(ids: string[]) {
  const selected = ids
    .map((id) => findContentView(id)?.id)
    .filter((id): id is ContentViewId => Boolean(id) && id !== fallbackContentView.id);
  return Array.from(new Set(selected)).join("|");
}

export function contentViewLabel(id: string) {
  return findContentView(id)?.label ?? fallbackContentView.label;
}

export function allowedContentViewLabels(encoded: string | null | undefined) {
  const selected = parseSelectedContentViews(encoded);
  return (selected.length ? selected : contentViews.map((view) => view.id)).map(contentViewLabel);
}
