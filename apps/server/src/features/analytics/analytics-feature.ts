import type { db as DbType } from '../../db';
import {
  GetOverviewStatsQuery,
  GetUsageOverTimeQuery,
  GetAgentDistributionQuery,
  GetProviderDistributionQuery,
  GetRecentActivityQuery,
  GetUsersWithSessionsQuery,
  GetTokensPerUserQuery,
  GetSessionDetailQuery,
} from './queries';
import type {
  GetUsageOverTimeInput,
  GetRecentActivityInput,
  GetUsersWithSessionsInput,
} from './queries';
import type { AnalyticsFilters } from './types';

/**
 * AnalyticsFeature - provides analytics queries for the admin dashboard
 */
export class AnalyticsFeature {
  private getOverviewStatsQuery: GetOverviewStatsQuery;
  private getUsageOverTimeQuery: GetUsageOverTimeQuery;
  private getAgentDistributionQuery: GetAgentDistributionQuery;
  private getProviderDistributionQuery: GetProviderDistributionQuery;
  private getRecentActivityQuery: GetRecentActivityQuery;
  private getUsersWithSessionsQuery: GetUsersWithSessionsQuery;
  private getTokensPerUserQuery: GetTokensPerUserQuery;
  private getSessionDetailQuery: GetSessionDetailQuery;

  constructor(db: typeof DbType, agentNames: Map<string, string>) {
    this.getOverviewStatsQuery = new GetOverviewStatsQuery(db);
    this.getUsageOverTimeQuery = new GetUsageOverTimeQuery(db);
    this.getAgentDistributionQuery = new GetAgentDistributionQuery(
      db,
      agentNames
    );
    this.getProviderDistributionQuery = new GetProviderDistributionQuery(db);
    this.getRecentActivityQuery = new GetRecentActivityQuery(db, agentNames);
    this.getUsersWithSessionsQuery = new GetUsersWithSessionsQuery(db);
    this.getTokensPerUserQuery = new GetTokensPerUserQuery(db);
    this.getSessionDetailQuery = new GetSessionDetailQuery(db, agentNames);
  }

  getOverviewStats(filters: AnalyticsFilters) {
    return this.getOverviewStatsQuery.execute(filters);
  }

  getUsageOverTime(input: GetUsageOverTimeInput) {
    return this.getUsageOverTimeQuery.execute(input);
  }

  getAgentDistribution(filters: AnalyticsFilters) {
    return this.getAgentDistributionQuery.execute(filters);
  }

  getProviderDistribution(filters: AnalyticsFilters) {
    return this.getProviderDistributionQuery.execute(filters);
  }

  getRecentActivity(input: GetRecentActivityInput) {
    return this.getRecentActivityQuery.execute(input);
  }

  getUsersWithSessions(input: GetUsersWithSessionsInput) {
    return this.getUsersWithSessionsQuery.execute(input);
  }

  getTokensPerUser(filters: AnalyticsFilters) {
    return this.getTokensPerUserQuery.execute(filters);
  }

  getSessionDetail(sessionId: string) {
    return this.getSessionDetailQuery.execute(sessionId);
  }
}
