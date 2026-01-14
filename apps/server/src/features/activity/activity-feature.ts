import type { ClerkClient } from '@clerk/backend';
import type { db as DbType } from '../../db';
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
  private recordHeartbeatCommand: RecordHeartbeatCommand;
  private getActivitySessionsQuery: GetActivitySessionsQuery;
  private getActivitySessionStatsQuery: GetActivitySessionStatsQuery;

  constructor(db: typeof DbType, clerk: ClerkClient) {
    this.recordHeartbeatCommand = new RecordHeartbeatCommand(db);
    this.getActivitySessionsQuery = new GetActivitySessionsQuery(db, clerk);
    this.getActivitySessionStatsQuery = new GetActivitySessionStatsQuery(db);
  }

  /**
   * Records a heartbeat to track user activity.
   * Creates a new session if inactive for too long, or updates existing session.
   */
  recordHeartbeat(input: RecordHeartbeatInput) {
    return this.recordHeartbeatCommand.execute(input);
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
