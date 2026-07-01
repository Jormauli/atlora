import type { WorkerExtracted, WorkerTask } from "@/lib/services/worker/contracts";

export interface TaskQueue {
  enqueueWeChat(task: WorkerTask): Promise<void>;
  enqueueExtracted(task: { ingestionId: string; extracted: WorkerExtracted }): Promise<void>;
}
