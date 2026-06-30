import { estimateTokens } from "@/lib/utils";
import type { GenerateCardInput, GenerateCardOutput, LLMProvider } from "./types";
import type { ModelRouteResult } from "@/lib/model-router";

const templateMeta: Record<string, { cardType: string; perspective: string; category: string }> = {
  content_view: { cardType: "knowledge", perspective: "knowledge", category: "知识点" },
  general_summary: { cardType: "general_summary", perspective: "general", category: "摘要" },
  content_creator: { cardType: "content_creator", perspective: "creator", category: "内容素材" },
  startup_product: { cardType: "startup_product", perspective: "founder", category: "创业产品" },
  investment_info: { cardType: "investment_info", perspective: "investment", category: "投资信息" },
  tool_app: { cardType: "tool_app", perspective: "tools", category: "工具应用" },
  learning_note: { cardType: "learning_note", perspective: "learning", category: "学习笔记" }
};

export class MockLLMProvider implements LLMProvider {
  async generateCard(input: GenerateCardInput, _route: ModelRouteResult): Promise<GenerateCardOutput> {
    const templateId = input.templateId.split("__")[0] || "content_view";
    const meta = templateMeta[templateId] ?? templateMeta.content_view;
    const titleBase = input.sourceTitle || input.content.slice(0, 18).replace(/\s+/g, " ");
    const payload = {
      title: titleBase || "未命名卡片",
      summary: `这张卡片整理的是“${titleBase || "输入内容"}”相关内容：它先说明材料讨论的对象和问题，再把可复用的信息压缩成观点、证据和视角提炼。因为当前使用 Mock Provider，具体事实需要回到原文或真实模型输出中核验。`,
      key_points: [
        "观点：卡片需要先交代材料对象和背景。｜论据：如果只写标题式摘要，没看过原文的人无法判断这条信息是否值得保存。",
        "观点：核心内容应压缩成观点加论据，而不是孤立要点。｜论据：论据能说明观点来自事实、案例、数据还是作者判断，便于后续复用和核验。",
        "观点：视角提炼要直接连接行动。｜论据：同一篇内容对投资理财、市场研究或知识学习的价值不同，拆成视角后更容易转成下一步动作。"
      ],
      action_items: meta.cardType === "investment_finance"
        ? ["补充原始来源", "核对关键数据", "仅供信息整理，不构成投资建议。"]
        : ["补充上下文", "整理下一步行动"],
      role_perspectives: [
        "【知识点】学习知识卡：核心概念是先确认材料讲了什么；前置知识是理解原文语境；复习问题是这条信息能否被自己复述。",
        "【工具/技能】实操工具箱：推荐工具清单需回到原文核验；可复用方法是把观点与论据绑定；效率提升点是减少空泛摘要。"
      ],
      tags: [meta.category, "信息卡片", "观点论据", "视角提炼"],
      knowledge_concepts: [
        { name: "RAG", aliases: ["Retrieval-Augmented Generation"], relevance: "high", evidence: "模拟卡片包含可复用知识点" }
      ],
      concept_relations: [],
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
