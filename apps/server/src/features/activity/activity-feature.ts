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
import { enrichWithClerkUserInfo, type WithClerkUserInfo } from '../shared';
import type { ActivitySessionItem } from './queries/get-activity-sessions';

export interface GetSessionsEnrichedResult {
  items: WithClerkUserInfo<ActivitySessionItem>[];
  nextCursor: string | undefined;
}

/**
 * ActivityFeature - manages user activity session tracking
 */
export class ActivityFeature {
  private clerk: ClerkClient;
  private recordHeartbeatCommand: RecordHeartbeatCommand;
  private getActivitySessionsQuery: GetActivitySessionsQuery;
  private getActivitySessionStatsQuery: GetActivitySessionStatsQuery;

  constructor(db: typeof DbType, clerk: ClerkClient) {
    this.clerk = clerk;
    this.recordHeartbeatCommand = new RecordHeartbeatCommand(db);
    this.getActivitySessionsQuery = new GetActivitySessionsQuery(db);
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
   * Returns data enriched with Clerk user info.
   */
  async getSessions(
    input: GetActivitySessionsInput
  ): Promise<GetSessionsEnrichedResult> {
    const result = await this.getActivitySessionsQuery.execute(input);
    const enrichedItems = await enrichWithClerkUserInfo(this.clerk, result.items);
    return {
      items: enrichedItems,
      nextCursor: result.nextCursor,
    };
  }

  /**
   * Gets aggregated statistics for activity sessions.
   */
  getStats(input: GetActivitySessionStatsInput) {
    return this.getActivitySessionStatsQuery.execute(input);
  }
}
