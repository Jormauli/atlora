import type { ModelRouteResult } from "@/lib/model-router";

export interface GenerateCardInput {
  prompt: string;
  content: string;
  templateId: string;
  sourceTitle?: string | null;
  sourceDomain?: string | null;
}

export interface GenerateCardOutput {
  raw: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMProvider {
  generateCard(input: GenerateCardInput, route: ModelRouteResult): Promise<GenerateCardOutput>;
  repairJson?(input: string, route: ModelRouteResult): Promise<string>;
}
