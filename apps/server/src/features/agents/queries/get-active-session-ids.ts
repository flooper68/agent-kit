import type { StreamingStateManager } from '../../../agent/streaming-state-manager';

export type GetActiveSessionIdsResult = Set<string>;

/**
 * GetActiveSessionIdsQuery - Gets all session IDs that are currently streaming
 * Used to enrich session lists with streaming status
 */
export class GetActiveSessionIdsQuery {
  constructor(private streamingStateManager: StreamingStateManager) {}

  async execute(): Promise<GetActiveSessionIdsResult> {
    return this.streamingStateManager.getActiveSessionIds();
  }
}
