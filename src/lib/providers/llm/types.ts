import type { ModelRouteResult } from "@/lib/model-router";

export interface GraphPromptContext {
  tags: Array<{ id: string; name: string; aliases: string[] }>;
  concepts: Array<{ id: string; name: string; aliases: string[]; description: string | null }>;
}

export interface GenerateCardInput {
  prompt: string;
  content: string;
  templateId: string;
  sourceTitle?: string | null;
  sourceDomain?: string | null;
  graphContext?: GraphPromptContext;
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
