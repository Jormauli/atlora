import { CloudTasksClient } from "@google-cloud/tasks";
import type { TaskQueue } from "./types";
import type { WorkerTask } from "@/lib/services/worker/contracts";

type TaskClient = {
  createTask(input: Record<string, unknown>): Promise<unknown>;
};

export function buildGoogleTaskName(parent: string, ingestionId: string) {
  const safeId = ingestionId.replace(/[^a-zA-Z0-9-]/g, "-");
  return `${parent}/tasks/wechat-${safeId}`;
}

export function createGoogleTaskQueue(input: {
  parent: string;
  workerUrl: string;
  serviceAccountEmail: string;
  client: TaskClient;
}): TaskQueue {
  const workerUrl = input.workerUrl.replace(/\/+$/, "");
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
