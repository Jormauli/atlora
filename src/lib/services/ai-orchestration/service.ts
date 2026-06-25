import { readFile } from "fs/promises";
import path from "path";
import { aiCardSchema } from "@/lib/validators/card";
import { getLLMProvider } from "@/lib/providers/llm";
import { routeModel } from "@/lib/model-router";
import { recordUsage } from "@/lib/services/usage/service";
import { allowedContentViewLabels } from "@/lib/content-views";

const promptFiles: Record<string, string> = {
  content_view: "content_view.zh.md",
  general_summary: "general_summary.zh.md",
  content_creator: "content_creator.zh.md",
  startup_product: "startup_product.zh.md",
  investment_info: "investment_info.zh.md",
  tool_app: "tool_app.zh.md",
  learning_note: "learning_note.zh.md"
};

async function loadPrompt(templateId: string) {
  const baseTemplateId = baseTemplate(templateId);
  const fileName = promptFiles[baseTemplateId] ?? promptFiles.content_view;
  const prompt = await readFile(path.join(process.cwd(), "src/lib/prompts", fileName), "utf8");
  if (baseTemplateId !== "content_view") return prompt;
  return `${prompt}\n\n【本次允许视角】\n${allowedContentViewLabels(encodedViewsFromTemplate(templateId)).map((label) => `- ${label}`).join("\n")}`;
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
    if (process.env.NODE_ENV === "development") {
      console.warn("AI card output failed schema validation", parsed.error.flatten());
    }
    throw new Error("AI_CARD_SCHEMA_INVALID");
  }

  return parsed.data;
}

function safeJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const matched = input.match(/\{[\s\S]*\}/);
    if (!matched) return null;
    try {
      return JSON.parse(matched[0]);
    } catch {
      return null;
    }
  }
}

function baseTemplate(templateId: string) {
  return templateId.split("__")[0] || "content_view";
}

function encodedViewsFromTemplate(templateId: string) {
  return templateId.includes("__") ? templateId.split("__")[1]?.replace(/,/g, "|") : null;
}
