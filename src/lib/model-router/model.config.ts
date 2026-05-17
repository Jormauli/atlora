export const modelConfig = {
  small: {
    model: process.env.LLM_SMALL_MODEL ?? process.env.LLM_MODEL ?? "mock-small",
    maxOutputTokens: Number(process.env.LLM_SMALL_MAX_OUTPUT_TOKENS ?? 800)
  },
  medium: {
    model: process.env.LLM_MEDIUM_MODEL ?? process.env.LLM_MODEL ?? "mock-medium",
    maxOutputTokens: Number(process.env.LLM_MEDIUM_MAX_OUTPUT_TOKENS ?? 1500)
  },
  large: {
    model: process.env.LLM_LARGE_MODEL ?? process.env.LLM_MODEL ?? "mock-large",
    maxOutputTokens: Number(process.env.LLM_LARGE_MAX_OUTPUT_TOKENS ?? 2500)
  },
  vision: {
    model: process.env.LLM_VISION_MODEL ?? process.env.LLM_MODEL ?? "mock-vision",
    maxOutputTokens: Number(process.env.LLM_VISION_MAX_OUTPUT_TOKENS ?? 2000)
  }
} as const;
