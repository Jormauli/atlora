import { CloudTasksClient } from "@google-cloud/tasks";
import type { TaskQueue } from "./types";
import type { WorkerTask } from "@/lib/services/worker/contracts";
import { signWorkerRequest } from "@/lib/services/worker/signature";

type TaskClient = {
  createTask(input: Record<string, unknown>): Promise<unknown>;
};

export function buildGoogleTaskName(parent: string, ingestionId: string) {
  const safeId = ingestionId.replace(/[^a-zA-Z0-9-]/g, "-");
  return `${parent}/tasks/wechat-${safeId}`;
}

export function buildGoogleExtractedTaskName(parent: string, ingestionId: string) {
  const safeId = ingestionId.replace(/[^a-zA-Z0-9-]/g, "-");
  return `${parent}/tasks/extracted-${safeId}`;
}

export function createGoogleTaskQueue(input: {
  parent: string;
  workerUrl: string;
  callbackBaseUrl?: string;
  callbackSecret?: string;
  vercelBypassSecret?: string;
  serviceAccountEmail: string;
  client: TaskClient;
}): TaskQueue {
  const workerUrl = input.workerUrl.replace(/\/+$/, "");
  const callbackBaseUrl = input.callbackBaseUrl?.replace(/\/+$/, "");
  return {
    async enqueueWeChat(payload: WorkerTask) {
      await input.client.createTask({
        parent: input.parent,
        task: {
          name: buildGoogleTaskName(input.parent, payload.ingestionId),
          httpRequest: {
            httpMethod: "POST",
            url: `${workerUrl}/tasks/extract`,
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(payload)),
            oidcToken: {
              serviceAccountEmail: input.serviceAccountEmail,
              audience: workerUrl
            }
          }
        }
      });
    },
    async enqueueExtracted(payload) {
      if (!callbackBaseUrl || !input.callbackSecret) {
        throw new Error("Callback task configuration is required");
      }
      const pathname = `/api/internal/ingestions/${payload.ingestionId}/extracted`;
      const body = JSON.stringify(payload.extracted);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = signWorkerRequest({
        secret: input.callbackSecret,
        method: "POST",
        pathname,
        timestamp,
        ingestionId: payload.ingestionId,
        body
      });
      await input.client.createTask({
        parent: input.parent,
        task: {
          name: buildGoogleExtractedTaskName(input.parent, payload.ingestionId),
          httpRequest: {
            httpMethod: "POST",
            url: `${callbackBaseUrl}${pathname}`,
            headers: {
              "Content-Type": "application/json",
              "x-atlora-timestamp": String(timestamp),
              "x-atlora-signature": signature,
              ...(input.vercelBypassSecret ? { "x-vercel-protection-bypass": input.vercelBypassSecret } : {})
            },
            body: Buffer.from(body)
          }
        }
      });
    }
  };
}

export function googleTaskQueueFromEnvironment(): TaskQueue {
  const project = requireEnv("GCP_PROJECT_ID");
  const location = requireEnv("GCP_TASKS_LOCATION");
  const queue = requireEnv("GCP_TASKS_QUEUE");
  return createGoogleTaskQueue({
    parent: `projects/${project}/locations/${location}/queues/${queue}`,
    workerUrl: requireEnv("WECHAT_WORKER_URL"),
    callbackBaseUrl: requireEnv("APP_URL"),
    callbackSecret: requireEnv("WORKER_CALLBACK_SECRET"),
    vercelBypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    serviceAccountEmail: requireEnv("GCP_TASKS_SERVICE_ACCOUNT_EMAIL"),
    client: new CloudTasksClient(cloudTasksClientOptions(process.env.GCP_SERVICE_ACCOUNT_JSON_BASE64)) as unknown as TaskClient
  });
}

export function cloudTasksClientOptions(encodedCredentials: string | undefined) {
  if (!encodedCredentials?.trim()) return {};
  const parsed = JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8")) as {
    client_email?: string;
    private_key?: string;
  };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON_BASE64 is invalid");
  }
  return { credentials: { client_email: parsed.client_email, private_key: parsed.private_key } };
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
