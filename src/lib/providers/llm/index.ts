import { MockLLMProvider } from "./mock";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./types";

export function getLLMProvider(): LLMProvider {
  switch (process.env.LLM_PROVIDER) {
    case "openai-compatible":
      return new OpenAICompatibleProvider();
    case "mock":
    default:
      return new MockLLMProvider();
  }
}
