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
    return {
      title: input.sourceTitle ?? "普通摘要卡",
      summary: `正文已接收，但 AI 输出没有通过结构化校验，因此这里只保留一张保底卡片。当前可确认的信息来自用户输入，具体观点、论据和角色启示需要稍后重新生成或人工补充。输入开头：${input.content.slice(0, 120)}`,
      key_points: [
        "观点：这张卡片是结构化失败后的保底结果。｜论据：AI 输出未能通过卡片字段校验，系统无法可靠提取完整摘要。",
        "观点：现阶段不能把保底内容当作原文结论。｜论据：保底卡只引用输入片段，没有完成事实、观点和推测的完整区分。",
        "观点：下一步应重新生成或补充原文。｜论据：只有拿到稳定正文和合格 JSON 后，才能生成可复用的信息卡片。"
      ],
      action_items: ["稍后重新生成"],
      framework_structure: [],
      critical_evidence: ["待验证：AI 输出未能通过结构化校验。"],
      reusable_insights: [],
      used_models: [],
      connections: [],
      role_perspectives: [
        "对星域使用者的启示：不要直接复用这张保底卡的判断。可转化动作：重新生成后再保存正式卡片。",
        "对编辑者的启示：先补全原文或截图，再检查观点是否有论据支撑。可转化动作：把缺失信息标注为待验证。"
      ],
      tags: ["保底卡片", "待验证", "结构化失败"],
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
