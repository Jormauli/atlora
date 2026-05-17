import { modelConfig } from "./model.config";

export type TaskType =
  | "classify"
  | "tagging"
  | "basic_summary"
  | "card_generation"
  | "deep_analysis"
  | "vision_analysis"
  | "weekly_report"
  | "json_repair";

export type ModelTier = "rule" | "small" | "medium" | "large" | "vision";

export interface ModelRouteInput {
  taskType: TaskType;
  contentLength: number;
  sourceType: "text" | "image" | "link" | "file";
  templateId?: string;
  userPlan?: "free" | "basic" | "pro";
  deepAnalysis?: boolean;
  requiresVision?: boolean;
  riskDomain?: "investment" | "medical" | "legal" | "normal";
}

export interface ModelRouteResult {
  tier: ModelTier;
  provider: string;
  model: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  reason: string;
}

export function routeModel(input: ModelRouteInput): ModelRouteResult {
  let tier: Exclude<ModelTier, "rule"> = "medium";
  if (input.requiresVision || input.taskType === "vision_analysis") tier = "vision";
  else if (["classify", "tagging", "json_repair", "basic_summary"].includes(input.taskType)) tier = "small";
  else if (input.taskType === "deep_analysis" || input.deepAnalysis) tier = "large";
  else if (input.taskType === "weekly_report") tier = "medium";

  return {
    tier,
    provider: process.env.LLM_PROVIDER ?? "mock",
    model: modelConfig[tier].model,
    maxInputTokens: tier === "small" ? 8000 : tier === "medium" ? 16000 : 32000,
    maxOutputTokens: modelConfig[tier].maxOutputTokens,
    reason: `${input.taskType} routed to ${tier}`
  };
}
