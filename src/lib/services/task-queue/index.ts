import type { TaskQueue } from "./types";
import { googleTaskQueueFromEnvironment } from "./google";

let queue: TaskQueue | undefined;

export function getTaskQueue() {
  queue ??= googleTaskQueueFromEnvironment();
  return queue;
}

