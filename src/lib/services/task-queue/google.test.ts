import test from "node:test";
import assert from "node:assert/strict";
import { buildGoogleTaskName, createGoogleTaskQueue } from "./google";

test("Google task names are deterministic per ingestion", () => {
  assert.equal(
    buildGoogleTaskName("projects/atlora/locations/asia-east2/queues/wechat", "cmq_123"),
    "projects/atlora/locations/asia-east2/queues/wechat/tasks/wechat-cmq-123"
  );
});

test("Google queue sends one OIDC-authenticated worker task", async () => {
  let request: Record<string, unknown> | undefined;
  const queue = createGoogleTaskQueue({
    parent: "projects/atlora/locations/asia-east2/queues/wechat",
    workerUrl: "https://worker.example.com",
    serviceAccountEmail: "tasks@atlora.iam.gserviceaccount.com",
    client: {
      async createTask(input) {
        request = input as Record<string, unknown>;
        return [{}];
      }
    }
  });

  await queue.enqueueWeChat({ ingestionId: "cmq_123", url: "https://mp.weixin.qq.com/s/example" });
  const task = request?.task as {
    name: string;
    httpRequest: { url: string; oidcToken: { serviceAccountEmail: string; audience: string }; body: Uint8Array };
  };
  assert.equal(task.name.endsWith("/tasks/wechat-cmq-123"), true);
  assert.equal(task.httpRequest.url, "https://worker.example.com/tasks/extract");
  assert.deepEqual(task.httpRequest.oidcToken, {
    serviceAccountEmail: "tasks@atlora.iam.gserviceaccount.com",
    audience: "https://worker.example.com"
  });
  assert.deepEqual(JSON.parse(Buffer.from(task.httpRequest.body).toString("utf8")), {
    ingestionId: "cmq_123",
    url: "https://mp.weixin.qq.com/s/example"
  });
});

