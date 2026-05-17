import { estimateTokens } from "@/lib/utils";
import type { GenerateCardInput, GenerateCardOutput, LLMProvider } from "./types";
import type { ModelRouteResult } from "@/lib/model-router";

export class OpenAICompatibleProvider implements LLMProvider {
  async generateCard(input: GenerateCardInput, route: ModelRouteResult): Promise<GenerateCardOutput> {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: route.model,
        messages: [
          { role: "system", content: input.prompt },
          { role: "user", content: input.content }
        ],
        temperature: 0.2
      })
    });
    if (!response.ok) throw new Error("LLM request failed");
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    return {
      raw,
      inputTokens: data.usage?.prompt_tokens ?? estimateTokens(input.prompt + input.content),
      outputTokens: data.usage?.completion_tokens ?? estimateTokens(raw)
    };
  }

  async repairJson(input: string, route: ModelRouteResult) {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: route.model,
        messages: [
          { role: "system", content: "修复以下内容为合法 JSON，只返回 JSON。" },
          { role: "user", content: input }
        ],
        temperature: 0
      })
    });
    if (!response.ok) throw new Error("LLM repair failed");
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? input;
  }
}
