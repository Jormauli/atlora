import { z } from "zod";
import { ingestionStages } from "@/lib/services/ingestion/state";

export const workerTaskSchema = z.object({
  ingestionId: z.string().min(1),
  url: z.string().url().refine((value) => new URL(value).protocol === "https:")
});

export const workerStageSchema = z.object({
  stage: z.enum(ingestionStages),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export const workerExtractedSchema = z.object({
  title: z.string().trim().max(500).optional(),
  text: z.string().trim().min(120).max(500_000),
  strategy: z.enum(["wechat_markdown", "wechat_screenshot_ocr"]),
  confidence: z.number().min(0).max(1).optional(),
  durationsMs: z.record(z.number().nonnegative()).optional(),
  sourceMetadata: z.record(z.unknown()).optional()
});

export const workerFailedSchema = z.object({
  failureCode: z.string().regex(/^[A-Z0-9_]{3,64}$/),
  message: z.string().trim().min(1).max(500),
  retryable: z.boolean().default(false),
  durationsMs: z.record(z.number().nonnegative()).optional()
});

export type WorkerTask = z.infer<typeof workerTaskSchema>;
export type WorkerStage = z.infer<typeof workerStageSchema>;
export type WorkerExtracted = z.infer<typeof workerExtractedSchema>;
export type WorkerFailed = z.infer<typeof workerFailedSchema>;
