export interface SerializableCard {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  frameworkStructure: string[];
  criticalEvidence: string[];
  reusableInsights: string[];
  usedModels: string[];
  connections: string[];
  rolePerspectives: string[];
  localizedContent: LocalizedCardContent | null;
  tags: string[];
  category: string;
  cardType: string;
  perspective: string;
  sourceType: "image" | "text" | "link";
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceDomain: string | null;
  knowledgeConcepts?: SerializedCardKnowledgeConcept[];
  aiTemplateId: string;
  status: "draft" | "saved" | "archived" | "deleted";
  visibility: "private" | "link_visible" | "public" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface SerializedCardKnowledgeConcept {
  id: string;
  name: string;
  description: string | null;
  relevance: "high" | "medium" | "low";
  evidence: string | null;
}

export interface LocalizedCardContentItem {
  title?: string;
  summary?: string;
  keyPoints?: string[];
  rolePerspectives?: string[];
  tags?: string[];
  category?: string;
  sourceTitle?: string | null;
}

export interface LocalizedCardContent {
  zh?: LocalizedCardContentItem;
  en?: LocalizedCardContentItem;
}
