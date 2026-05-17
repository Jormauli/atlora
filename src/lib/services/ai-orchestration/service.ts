import { readFile } from "fs/promises";
import path from "path";
import { aiCardSchema } from "@/lib/validators/card";
import { getLLMProvider } from "@/lib/providers/llm";
import { routeModel } from "@/lib/model-router";
import { recordUsage } from "@/lib/services/usage/service";

const promptFiles: Record<string, string> = {
  general_summary: "general_summary.zh.md",
  content_creator: "content_creator.zh.md",
  startup_product: "startup_product.zh.md",
  investment_info: "investment_info.zh.md",
  tool_app: "tool_app.zh.md",
  learning_note: "learning_note.zh.md"
};

async function loadPrompt(templateId: string) {
  const fileName = promptFiles[templateId] ?? promptFiles.general_summary;
  return readFile(path.join(process.cwd(), "src/lib/prompts", fileName), "utf8");
}

export async function generateCardDraft(input: {
  userId: string;
  content: string;
  templateId: string;
  sourceType: "text" | "image" | "link";
  sourceTitle?: string | null;
  sourceDomain?: string | null;
  deepAnalysis?: boolean;
  requiresVision?: boolean;
}) {
  const route = routeModel({
    taskType: input.deepAnalysis ? "deep_analysis" : "card_generation",
    contentLength: input.content.length,
    sourceType: input.sourceType,
    templateId: input.templateId,
    deepAnalysis: input.deepAnalysis,
    requiresVision: input.requiresVision
  });
  const prompt = await loadPrompt(input.templateId);
  const provider = getLLMProvider();
  const output = await provider.generateCard(
    {
      prompt,
      content: input.content,
      templateId: input.templateId,
      sourceTitle: input.sourceTitle,
      sourceDomain: input.sourceDomain
    },
    route
  );

  await recordUsage({
    userId: input.userId,
    usageType: "llm_input",
    taskType: "card_generation",
    route,
    inputTokens: output.inputTokens,
    unit: "tokens"
  });
  await recordUsage({
    userId: input.userId,
    usageType: "llm_output",
    taskType: "card_generation",
    route,
    outputTokens: output.outputTokens,
    unit: "tokens"
  });

  let parsed = aiCardSchema.safeParse(safeJson(output.raw));
  if (!parsed.success && provider.repairJson) {
    const repairRoute = routeModel({
      taskType: "json_repair",
      contentLength: output.raw.length,
      sourceType: input.sourceType
    });
    const repaired = await provider.repairJson(output.raw, repairRoute);
    parsed = aiCardSchema.safeParse(safeJson(repaired));
  }

  if (!parsed.success) {
    return {
      title: input.sourceTitle ?? "普通摘要卡",
      summary: input.content.slice(0, 80),
      key_points: ["AI 输出异常，已生成保底摘要。"],
      action_items: ["稍后重新生成"],
      tags: ["普通摘要"],
      category: "摘要",
      card_type: "general_summary",
      perspective: "general",
      source_title: input.sourceTitle ?? null,
      source_domain: input.sourceDomain ?? null
    };
  }

  return parsed.data;
}

function safeJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
