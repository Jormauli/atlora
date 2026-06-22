export const ingestionStages = [
  "queued",
  "opening_article",
  "extracting_text",
  "capturing_screenshot",
  "recognizing_text",
  "generating_card",
  "completed",
  "failed"
] as const;

export type IngestionStageValue = (typeof ingestionStages)[number];

const transitions: Record<IngestionStageValue, ReadonlySet<IngestionStageValue>> = {
  queued: new Set<IngestionStageValue>(["opening_article", "failed"]),
  opening_article: new Set<IngestionStageValue>(["extracting_text", "failed"]),
  extracting_text: new Set<IngestionStageValue>(["capturing_screenshot", "generating_card", "failed"]),
  capturing_screenshot: new Set<IngestionStageValue>(["recognizing_text", "failed"]),
  recognizing_text: new Set<IngestionStageValue>(["capturing_screenshot", "generating_card", "failed"]),
  generating_card: new Set<IngestionStageValue>(["completed", "failed"]),
  completed: new Set<IngestionStageValue>(),
  failed: new Set<IngestionStageValue>()
};

export function canTransitionIngestionStage(current: IngestionStageValue, next: IngestionStageValue) {
  return current === next || transitions[current].has(next);
}
