import { z } from "zod";

export const aiCardSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  key_points: z.array(z.string()).default([]),
  action_items: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
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
  tags: z.array(z.string()).optional(),
  category: z.string().min(1).optional()
});
