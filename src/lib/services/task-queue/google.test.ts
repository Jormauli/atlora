import test from "node:test";
import assert from "node:assert/strict";
import { buildGoogleTaskName, cloudTasksClientOptions, createGoogleTaskQueue } from "./google";

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

test("Google queue can schedule a signed extracted callback back to Vercel", async () => {
  let request: Record<string, unknown> | undefined;
  const queue = createGoogleTaskQueue({
    parent: "projects/atlora/locations/asia-east2/queues/wechat",
    workerUrl: "https://worker.example.com",
    callbackBaseUrl: "https://www.atlora.io",
    callbackSecret: "test-worker-secret-with-enough-entropy",
    serviceAccountEmail: "tasks@atlora.iam.gserviceaccount.com",
    client: {
      async createTask(input) {
        request = input as Record<string, unknown>;
        return [{}];
      }
    }
  });

  await queue.enqueueExtracted({
    ingestionId: "cmq_123",
    extracted: {
      title: "标题",
      text: "正文内容".repeat(40),
      strategy: "wechat_markdown",
      confidence: 1,
      sourceMetadata: { strategy: "vercel_html" }
    }
  });

  const task = request?.task as {
    name: string;
    httpRequest: { url: string; headers: Record<string, string>; body: Uint8Array };
  };
  assert.equal(task.name.endsWith("/tasks/extracted-cmq-123"), true);
  assert.equal(task.httpRequest.url, "https://www.atlora.io/api/internal/ingestions/cmq_123/extracted");
  assert.ok(task.httpRequest.headers["x-atlora-timestamp"]);
  assert.match(task.httpRequest.headers["x-atlora-signature"], /^[a-f0-9]{64}$/);
  assert.deepEqual(JSON.parse(Buffer.from(task.httpRequest.body).toString("utf8")), {
    title: "标题",
    text: "正文内容".repeat(40),
    strategy: "wechat_markdown",
    confidence: 1,
    sourceMetadata: { strategy: "vercel_html" }
  });
});

test("Vercel credentials are decoded without writing a key file", () => {
  const encoded = Buffer.from(JSON.stringify({
    client_email: "queue@example.iam.gserviceaccount.com",
    private_key: "private-key"
  })).toString("base64");
  assert.deepEqual(cloudTasksClientOptions(encoded), {
    credentials: {
      client_email: "queue@example.iam.gserviceaccount.com",
      private_key: "private-key"
    }
  });
  assert.deepEqual(cloudTasksClientOptions(undefined), {});
});
