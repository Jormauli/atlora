import { estimateTokens } from "@/lib/utils";
import type { GenerateCardInput, GenerateCardOutput, LLMProvider } from "./types";
import type { ModelRouteResult } from "@/lib/model-router";

export class OpenAICompatibleProvider implements LLMProvider {
  async generateCard(input: GenerateCardInput, route: ModelRouteResult): Promise<GenerateCardOutput> {
    const data = await postChatCompletion(
      {
        model: route.model,
        messages: [
          { role: "system", content: input.prompt },
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
      inputTokens: data.usage?.prompt_tokens ?? estimateTokens(input.prompt + input.content),
      outputTokens: data.usage?.completion_tokens ?? estimateTokens(raw)
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

type ChatCompletionBody = {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature: number;
  max_tokens: number;
  response_format: { type: "json_object" };
};

const llmRequestTimeoutMs = 20000;

async function postChatCompletion(body: ChatCompletionBody, errorMessage: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(llmRequestTimeoutMs)
    });
    if (response.ok) return response.json();
    if (response.status < 500 || attempt === 1) throw new Error(errorMessage);
    await delay(150 * (attempt + 1));
  }
  throw new Error(errorMessage);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
