export interface SerializableCard {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  tags: string[];
  category: string;
  cardType: string;
  perspective: string;
  sourceType: "image" | "text" | "link";
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceDomain: string | null;
  aiTemplateId: string;
  status: "draft" | "saved" | "archived" | "deleted";
  visibility: "private" | "link_visible" | "public" | "paid";
  createdAt: string;
  updatedAt: string;
}
