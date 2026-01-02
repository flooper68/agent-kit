import { randomUUID } from 'crypto';
import type { AgentSessionManager } from './agent-session-manager';
import { AgentJobHandler } from './agent-job-handler';

/**
 * Agent Worker - consumes jobs from the queue and processes them
 * Each job is handled by a new AgentJobHandler instance
 */
export class AgentWorker {
  private sessionManager: AgentSessionManager;
  private workerId: string;
  private isRunning = false;

  constructor(sessionManager: AgentSessionManager) {
    this.sessionManager = sessionManager;
    this.workerId = `worker-${randomUUID().slice(0, 8)}`;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[AgentWorker ${this.workerId}] Starting worker...`);

    try {
      // Start consuming jobs - this runs forever
      await this.sessionManager.consumeJobs(
        'agent-workers',
        this.workerId,
        async (job) => {
          console.log(`[AgentWorker ${this.workerId}] Received job:`, job.id);
          const handler = new AgentJobHandler(
            this.sessionManager,
            this.workerId
          );
          await handler.handle(job);
        }
      );
    } catch (error) {
      console.error(`[AgentWorker ${this.workerId}] Worker error:`, error);
      throw error;
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log(`Agent worker ${this.workerId} stopping...`);
  }
}
