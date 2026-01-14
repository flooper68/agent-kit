import type { ClerkClient } from '@clerk/backend';
import type { db as DbType } from '../../db';
import { ActivityCommandContextManager } from './context';
import { RecordHeartbeatCommand } from './commands';
import type { RecordHeartbeatInput } from './commands';
import {
  GetActivitySessionsQuery,
  GetActivitySessionStatsQuery,
} from './queries';
import type {
  GetActivitySessionsInput,
  GetActivitySessionStatsInput,
} from './queries';

/**
 * ActivityFeature - manages user activity session tracking
 */
export class ActivityFeature {
  private contextManager: ActivityCommandContextManager;
  private recordHeartbeatCommand: RecordHeartbeatCommand;
  private getActivitySessionsQuery: GetActivitySessionsQuery;
  private getActivitySessionStatsQuery: GetActivitySessionStatsQuery;

  constructor(db: typeof DbType, clerk: ClerkClient) {
    this.contextManager = new ActivityCommandContextManager(db);
    this.recordHeartbeatCommand = new RecordHeartbeatCommand();
    this.getActivitySessionsQuery = new GetActivitySessionsQuery(db, clerk);
    this.getActivitySessionStatsQuery = new GetActivitySessionStatsQuery(db);
  }

  /**
   * Records a heartbeat to track user activity.
   * Creates a new session if inactive for too long, or updates existing session.
   * Uses a transaction to ensure atomicity.
   */
  recordHeartbeat(input: RecordHeartbeatInput) {
    return this.contextManager.handleCommand((ctx) =>
      this.recordHeartbeatCommand.execute(ctx, input)
    );
  }

  /**
   * Gets a paginated list of activity sessions for analytics.
   */
  getSessions(input: GetActivitySessionsInput) {
    return this.getActivitySessionsQuery.execute(input);
  }

  /**
   * Gets aggregated statistics for activity sessions.
   */
  getStats(input: GetActivitySessionStatsInput) {
    return this.getActivitySessionStatsQuery.execute(input);
  }
}
