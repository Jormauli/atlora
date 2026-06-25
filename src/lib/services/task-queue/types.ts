import type { WorkerTask } from "@/lib/services/worker/contracts";

export interface TaskQueue {
  enqueueWeChat(task: WorkerTask): Promise<void>;
}

