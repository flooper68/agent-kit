import type { EventStreamManager } from '../../../agent/event-stream-manager';
import type { StreamingStateManager } from '../../../agent/streaming-state-manager';
import type { JobRegistryManager } from '../../../agent/job-registry-manager';
import type { JobQueueManager } from '../../../agent/job-queue-manager';
import type { ExternalAgentWebSocketRegistry } from '../../../agent/external-agent-websocket-registry';

export interface InterruptSessionDeps {
  eventStreamManager: EventStreamManager;
  streamingStateManager: StreamingStateManager;
  jobRegistryManager: JobRegistryManager;
  jobQueueManager: JobQueueManager;
  externalAgentWSRegistry: ExternalAgentWebSocketRegistry;
}

export interface InterruptSessionInput {
  sessionId: string;
  isLocalAgent: boolean;
  agentId: string;
}

/**
 * InterruptSessionCommand - Handles interrupting an active agent session
 *
 * For server agents:
 * - Emits 'interrupted' event immediately so UI updates right away
 * - Stops streaming state
 * - Sets interrupt flag for worker to see
 * - Releases session locks so new messages can be sent
 *
 * For external/local agents:
 * - Forwards interrupt via WebSocket
 * - Stops streaming state
 */
export class InterruptSessionCommand {
  constructor(private deps: InterruptSessionDeps) {}

  async execute(input: InterruptSessionInput): Promise<{ success: true }> {
    const { sessionId, isLocalAgent, agentId } = input;

    if (isLocalAgent) {
      // External agents handle their own processing via WebSocket
      this.deps.externalAgentWSRegistry.sendMessage(agentId, {
        type: 'interrupt',
        sessionId,
        timestamp: new Date().toISOString(),
      });

      await this.deps.streamingStateManager.stopStreaming(sessionId);
      return { success: true };
    }

    // Server agent - uses job queue and job registry
    const messageId =
      await this.deps.jobRegistryManager.getActiveMessageId(sessionId);

    // Emit interrupted event immediately so UI updates right away
    // This prevents hanging when the worker process is dead or unresponsive
    if (messageId) {
      await this.deps.eventStreamManager.publish(sessionId, {
        type: 'interrupted',
        sessionId,
        messageId,
      });
    }

    // Stop streaming state
    await this.deps.streamingStateManager.stopStreaming(sessionId);

    // Set interrupt flag so live workers will see it and abort
    await this.deps.jobRegistryManager.requestInterrupt(sessionId);

    // Release the session locks so new messages can be sent even if worker is dead
    await this.deps.jobRegistryManager.releaseSession(sessionId);
    await this.deps.jobQueueManager.releaseSessionLock(sessionId);

    return { success: true };
  }
}
