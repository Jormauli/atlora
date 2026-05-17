import { prisma } from "@/lib/db/prisma";
import type { ModelRouteResult, TaskType } from "@/lib/model-router";

export async function recordUsage(input: {
  userId: string;
  usageType: "ocr" | "llm_input" | "llm_output" | "image_upload" | "card_generate" | "link_fetch";
  taskType: TaskType | string;
  route?: ModelRouteResult;
  provider?: string;
  modelName?: string;
  inputTokens?: number;
  outputTokens?: number;
  quantity?: number;
  unit?: string;
  relatedId?: string;
}) {
  return prisma.usageLedger.create({
    data: {
      userId: input.userId,
      usageType: input.usageType,
      taskType: input.taskType,
      modelTier: input.route?.tier ?? "rule",
      provider: input.route?.provider ?? input.provider ?? "local",
      modelName: input.route?.model ?? input.modelName ?? "none",
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? "count",
      relatedId: input.relatedId,
      costEstimate: 0
    }
  });
}
