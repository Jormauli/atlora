import { estimateTokens } from "@/lib/utils";
import type { GenerateCardInput, GenerateCardOutput, LLMProvider } from "./types";
import type { ModelRouteResult } from "@/lib/model-router";

export class OpenAICompatibleProvider implements LLMProvider {
  async generateCard(input: GenerateCardInput, route: ModelRouteResult): Promise<GenerateCardOutput> {
    const systemPrompt = withGraphContext(input);
    const data = await postChatCompletion(
      {
        model: route.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.content }
        ],
        temperature: 0.2,
        max_tokens: route.maxOutputTokens,
        response_format: { type: "json_object" }
      },
      "LLM request failed"
    );
    const raw = data.choices?.[0]?.message?.content ?? "";
    return {
      raw,
      inputTokens: data.usage?.prompt_tokens ?? estimateTokens(systemPrompt + input.content),
      outputTokens: data.usage?.completion_tokens ?? estimateTokens(raw),
      finishReason: data.choices?.[0]?.finish_reason ?? null
    };
  }

  async repairJson(input: string, route: ModelRouteResult) {
    const data = await postChatCompletion(
      {
        model: route.model,
        messages: [
          { role: "system", content: "修复以下内容为合法 JSON，只返回 JSON。" },
          { role: "user", content: input }
        ],
        temperature: 0,
        max_tokens: route.maxOutputTokens,
        response_format: { type: "json_object" }
      },
      "LLM repair failed"
    );
    return data.choices?.[0]?.message?.content ?? input;
  }
}

function withGraphContext(input: GenerateCardInput) {
  const context = input.graphContext;
  if (!context || (!context.tags.length && !context.concepts.length)) return input.prompt;
  const tags = context.tags
    .map((tag) => `- ${tag.id}: ${tag.name}${tag.aliases.length ? `（别名：${tag.aliases.join("、")}）` : ""}`)
    .join("\n");
  const concepts = context.concepts
    .map((concept) => {
      const aliases = concept.aliases.length ? `（别名：${concept.aliases.join("、")}）` : "";
      const description = concept.description ? `：${concept.description}` : "";
      return `- ${concept.id}: ${concept.name}${aliases}${description}`;
    })
    .join("\n");
  return `${input.prompt}

【已有标签与知识点】
生成 tags 和 knowledge_concepts 时，优先复用以下已有条目；同一含义不要创造新表达。若复用知识点，可在 knowledge_concepts 中填入对应 id。

已有标签：
${tags || "- 无"}

已有知识点：
${concepts || "- 无"}`;
}

type ChatCompletionBody = {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature: number;
  max_tokens: number;
  response_format: { type: "json_object" };
};

const defaultLlmRequestTimeoutMs = 45000;

async function postChatCompletion(body: ChatCompletionBody, errorMessage: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(llmRequestTimeoutMs())
    });
    if (response.ok) return response.json();
    if (response.status < 500 || attempt === 1) throw new Error(errorMessage);
    await delay(150 * (attempt + 1));
  }
  throw new Error(errorMessage);
}

function llmRequestTimeoutMs() {
  const configured = Number(process.env.LLM_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : defaultLlmRequestTimeoutMs;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
