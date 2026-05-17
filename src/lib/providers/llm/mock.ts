import { estimateTokens } from "@/lib/utils";
import type { GenerateCardInput, GenerateCardOutput, LLMProvider } from "./types";
import type { ModelRouteResult } from "@/lib/model-router";

const templateMeta: Record<string, { cardType: string; perspective: string; category: string }> = {
  general_summary: { cardType: "general_summary", perspective: "general", category: "摘要" },
  content_creator: { cardType: "content_creator", perspective: "creator", category: "内容素材" },
  startup_product: { cardType: "startup_product", perspective: "founder", category: "创业产品" },
  investment_info: { cardType: "investment_info", perspective: "investment", category: "投资信息" },
  tool_app: { cardType: "tool_app", perspective: "tools", category: "工具应用" },
  learning_note: { cardType: "learning_note", perspective: "learning", category: "学习笔记" }
};

export class MockLLMProvider implements LLMProvider {
  async generateCard(input: GenerateCardInput, _route: ModelRouteResult): Promise<GenerateCardOutput> {
    const meta = templateMeta[input.templateId] ?? templateMeta.general_summary;
    const titleBase = input.sourceTitle || input.content.slice(0, 18).replace(/\s+/g, " ");
    const payload = {
      title: titleBase || "未命名卡片",
      summary: `围绕“${titleBase || "输入内容"}”生成的一句话摘要。`,
      key_points: ["提炼出主要信息", "识别出值得保留的观点"],
      action_items: meta.cardType === "investment_info"
        ? ["补充原始来源", "核对关键数据", "仅供信息整理，不构成投资建议。"]
        : ["补充上下文", "整理下一步行动"],
      tags: [meta.category, "AI生成"],
      category: meta.category,
      card_type: meta.cardType,
      perspective: meta.perspective,
      source_title: input.sourceTitle ?? null,
      source_domain: input.sourceDomain ?? null
    };
    const raw = JSON.stringify(payload);
    return {
      raw,
      inputTokens: estimateTokens(input.prompt + input.content),
      outputTokens: estimateTokens(raw)
    };
  }

  async repairJson(input: string) {
    return input;
  }
}
