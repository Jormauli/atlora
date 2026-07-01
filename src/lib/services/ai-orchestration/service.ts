import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
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
  const graphContext = await getGraphPromptContext(input.userId);
  const provider = getLLMProvider();
  const output = await provider.generateCard(
    {
      prompt,
      content: input.content,
      templateId: input.templateId,
      sourceTitle: input.sourceTitle,
      sourceDomain: input.sourceDomain,
      graphContext
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
    const parsedOutput = safeJson(output.raw);
    console.warn("AI card output failed schema validation", {
      templateId: input.templateId,
      sourceType: input.sourceType,
      outputShape: describeOutputShape(parsedOutput),
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
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

function describeOutputShape(value: unknown) {
  if (!value || typeof value !== "object") return { type: value === null ? "null" : typeof value };
  if (Array.isArray(value)) return { type: "array", length: value.length };
  const record = value as Record<string, unknown>;
  return {
    type: "object",
    keys: Object.keys(record).slice(0, 20),
    nestedObjectKeys: Object.fromEntries(
      Object.entries(record)
        .filter(([, nested]) => nested && typeof nested === "object")
        .slice(0, 5)
        .map(([key, nested]) => [
          key,
          Array.isArray(nested)
            ? [`array(${nested.length})`]
            : Object.keys(nested as Record<string, unknown>).slice(0, 20)
        ])
    )
  };
}

function baseTemplate(templateId: string) {
  return templateId.split("__")[0] || "content_view";
}

function encodedViewsFromTemplate(templateId: string) {
  return templateId.includes("__") ? templateId.split("__")[1]?.replace(/,/g, "|") : null;
}

async function getGraphPromptContext(userId: string) {
  const [tags, concepts] = await Promise.all([
    prisma.tag.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 40 }),
    prisma.knowledgeConcept.findMany({ where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 80 })
  ]);
  return {
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name, aliases: jsonStringArray(tag.aliases) })),
    concepts: concepts.map((concept) => ({
      id: concept.id,
      name: concept.canonicalName,
      aliases: jsonStringArray(concept.aliases),
      description: concept.description
    }))
  };
}

function jsonStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : [];
}
