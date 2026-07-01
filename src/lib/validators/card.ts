import { z } from "zod";
import { conceptRelationTypes } from "@/lib/services/knowledge-graph/types";

const stringListSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return Object.values(item).filter(Boolean).join("：").trim();
      return String(item ?? "").trim();
    })
    .filter(Boolean);
}, z.array(z.string()).default([]));

const localizedCardItemSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  key_points: z.array(z.string()).optional(),
  rolePerspectives: z.array(z.string()).optional(),
  role_perspectives: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  sourceTitle: z.string().nullable().optional(),
  source_title: z.string().nullable().optional()
}).transform((value) => ({
  title: value.title,
  summary: value.summary,
  keyPoints: value.keyPoints ?? value.key_points,
  rolePerspectives: value.rolePerspectives ?? value.role_perspectives,
  tags: value.tags,
  category: value.category,
  sourceTitle: value.sourceTitle ?? value.source_title
}));

export const localizedCardContentSchema = z.object({
  zh: localizedCardItemSchema.optional(),
  en: localizedCardItemSchema.optional()
}).partial();

const aliasesSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}, z.array(z.string()).default([]));

const conceptRelevanceValues = ["high", "medium", "low"] as const;
const conceptRelevanceSchema = z.enum(conceptRelevanceValues).default("medium");

const knowledgeConceptCandidateSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1).max(80),
  aliases: aliasesSchema,
  description: z.string().trim().max(240).nullable().optional(),
  relevance: conceptRelevanceSchema,
  evidence: z.string().trim().max(500).nullable().optional(),
  reason: z.string().trim().max(240).nullable().optional()
});

const conceptRelationCandidateSchema = z.object({
  source: z.string().trim().min(1).max(80),
  relation_type: z.enum(conceptRelationTypes),
  target: z.string().trim().min(1).max(80),
  evidence: z.string().trim().max(500).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.7)
});

const forgivingKnowledgeConceptsSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    const relevance = conceptRelevanceValues.includes(candidate.relevance as typeof conceptRelevanceValues[number])
      ? candidate.relevance
      : "medium";
    const parsed = knowledgeConceptCandidateSchema.safeParse({
      ...candidate,
      relevance
    });
    return parsed.success ? [parsed.data] : [];
  });
}, z.array(knowledgeConceptCandidateSchema).default([]));

const relationTypeSet = new Set<string>(conceptRelationTypes);
const forgivingConceptRelationsSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    const relationType = relationTypeSet.has(String(candidate.relation_type))
      ? candidate.relation_type
      : "related_to";
    const parsed = conceptRelationCandidateSchema.safeParse({
      ...candidate,
      relation_type: relationType,
      confidence: candidate.confidence === undefined ? undefined : Number(candidate.confidence)
    });
    return parsed.success ? [parsed.data] : [];
  });
}, z.array(conceptRelationCandidateSchema).default([]));

const aiCardObjectSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  key_points: stringListSchema,
  action_items: stringListSchema,
  framework_structure: stringListSchema,
  critical_evidence: stringListSchema,
  reusable_insights: stringListSchema,
  used_models: stringListSchema,
  connections: stringListSchema,
  role_perspectives: stringListSchema,
  localized_content: localizedCardContentSchema.nullable().optional(),
  tags: stringListSchema,
  category: z.string().default("未分类"),
  card_type: z.string().default("general_summary"),
  perspective: z.string().default("general"),
  source_title: z.string().nullable().optional(),
  source_domain: z.string().nullable().optional(),
  knowledge_concepts: forgivingKnowledgeConceptsSchema,
  concept_relations: forgivingConceptRelationsSchema
});

export const aiCardSchema = z.preprocess(normalizeAiCardPayload, aiCardObjectSchema);

function normalizeAiCardPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    const firstObject = value.find((item) => item && typeof item === "object" && !Array.isArray(item));
    return firstObject ? normalizeAiCardPayload(firstObject) : value;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const input = unwrapCardPayload(value as Record<string, unknown>);
  return {
    ...input,
    title: pick(input, ["title", "标题"]),
    summary: pick(input, ["summary", "摘要", "总结"]),
    key_points: pick(input, ["key_points", "keyPoints", "核心观点", "核心观点与论据", "要点", "核心要点"]),
    action_items: pick(input, ["action_items", "actionItems", "行动项", "行动建议", "可执行动作"]),
    framework_structure: pick(input, ["framework_structure", "frameworkStructure", "结构框架"]),
    critical_evidence: pick(input, ["critical_evidence", "criticalEvidence", "关键证据"]),
    reusable_insights: pick(input, ["reusable_insights", "reusableInsights", "可复用洞察"]),
    used_models: pick(input, ["used_models", "usedModels", "使用模型"]),
    connections: pick(input, ["connections", "关联", "连接"]),
    role_perspectives: pick(input, ["role_perspectives", "rolePerspectives", "视角提炼", "角色视角"]),
    localized_content: pick(input, ["localized_content", "localizedContent", "本地化内容"]),
    tags: pick(input, ["tags", "标签"]),
    category: pick(input, ["category", "分类"]),
    card_type: pick(input, ["card_type", "cardType", "卡片类型"]),
    perspective: pick(input, ["perspective", "视角"]),
    source_title: pick(input, ["source_title", "sourceTitle", "原文标题", "来源标题"]),
    source_domain: pick(input, ["source_domain", "sourceDomain", "来源域名"]),
    knowledge_concepts: pick(input, ["knowledge_concepts", "knowledgeConcepts", "知识点"]),
    concept_relations: pick(input, ["concept_relations", "conceptRelations", "知识点关系", "概念关系"])
  };
}

function unwrapCardPayload(input: Record<string, unknown>) {
  for (const key of ["card", "data", "result", "output", "cards", "cardList", "卡片", "知识卡片", "信息卡片", "输出", "结果"]) {
    const value = input[key];
    if (Array.isArray(value)) {
      const firstObject = value.find((item) => item && typeof item === "object" && !Array.isArray(item));
      if (firstObject) return firstObject as Record<string, unknown>;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  if (!hasRecognizedCardField(input)) {
    const objectValues = Object.values(input).filter((value) => value && typeof value === "object" && !Array.isArray(value)) as Record<string, unknown>[];
    if (objectValues.length === 1) return objectValues[0];
  }
  return input;
}

function hasRecognizedCardField(input: Record<string, unknown>) {
  return [
    "title",
    "标题",
    "summary",
    "摘要",
    "key_points",
    "keyPoints",
    "核心观点",
    "核心要点"
  ].some((key) => input[key] !== undefined);
}

function pick(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (input[key] !== undefined) return input[key];
  }
  return undefined;
}

export const cardPatchSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  keyPoints: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  frameworkStructure: z.array(z.string()).optional(),
  criticalEvidence: z.array(z.string()).optional(),
  reusableInsights: z.array(z.string()).optional(),
  usedModels: z.array(z.string()).optional(),
  connections: z.array(z.string()).optional(),
  rolePerspectives: z.array(z.string()).optional(),
  localizedContent: localizedCardContentSchema.nullable().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().min(1).optional()
});
