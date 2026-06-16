import { z } from "zod";

export const templateIds = [
  "auto",
  "general_summary",
  "content_creator",
  "startup_product",
  "investment_info",
  "tool_app",
  "learning_note"
] as const;

const templateIdSchema = z.string().default("auto").refine((value) => (
  (templateIds as readonly string[]).includes(value) ||
  /^content_view__(investment_finance|market_research|tool_skill|personal_growth|news|knowledge|viral_article)$/.test(value)
), "模板不存在");

export const textIngestionSchema = z.object({
  text: z.string().trim().min(1),
  templateId: templateIdSchema,
  deepAnalysis: z.boolean().optional(),
  requiresVision: z.boolean().optional()
});

export const linkIngestionSchema = z.object({
  url: z.string().url(),
  templateId: templateIdSchema,
  deepAnalysis: z.boolean().optional(),
  requiresVision: z.boolean().optional()
});
