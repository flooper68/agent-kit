import type { StreamingStateManager } from '../../../agent/streaming-state-manager';

/**
 * GetActiveSessionIdsQuery - Gets all session IDs that are currently streaming
 * Used to enrich session lists with streaming status
 */
export class GetActiveSessionIdsQuery {
  constructor(private streamingStateManager: StreamingStateManager) {}

  async execute(): Promise<Set<string>> {
    return this.streamingStateManager.getActiveSessionIds();
  }
}
