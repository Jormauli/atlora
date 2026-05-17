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

export const textIngestionSchema = z.object({
  text: z.string().trim().min(1),
  templateId: z.enum(templateIds).default("auto"),
  deepAnalysis: z.boolean().optional(),
  requiresVision: z.boolean().optional()
});

export const linkIngestionSchema = z.object({
  url: z.string().url(),
  templateId: z.enum(templateIds).default("auto"),
  deepAnalysis: z.boolean().optional(),
  requiresVision: z.boolean().optional()
});
