export type AnalyticsEventName =
  | "user_registered"
  | "user_logged_in"
  | "material_submitted"
  | "link_ingestion_started"
  | "link_ingestion_failed"
  | "card_generated"
  | "card_saved"
  | "knowledge_concept_added"
  | "knowledge_concept_removed";

const allowedPropertyKeys = new Set(["sourceType", "templateId", "domain", "status", "failureCode", "stage", "conceptSource"]);

export function isAnalyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function safeAnalyticsProperties(input: Record<string, unknown> = {}) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowedPropertyKeys.has(key)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    result[key] = value.trim().slice(0, 120);
  }
  return result;
}

export function domainFromUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

export function buildPostHogCapturePayload(input: {
  apiKey: string;
  userId?: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
}) {
  return {
    api_key: input.apiKey,
    event: input.event,
    distinct_id: input.userId ?? "anonymous",
    properties: safeAnalyticsProperties(input.properties)
  };
}

export async function captureServerEvent(input: {
  userId?: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  const payload = buildPostHogCapturePayload({
    apiKey,
    userId: input.userId,
    event: input.event,
    properties: input.properties
  });
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1500)
    });
  } catch (error) {
    console.error("[analytics] capture failed", error);
  }
}
