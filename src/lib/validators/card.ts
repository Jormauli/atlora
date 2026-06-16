import { z } from "zod";

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

export const aiCardSchema = z.object({
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
  source_domain: z.string().nullable().optional()
});

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
