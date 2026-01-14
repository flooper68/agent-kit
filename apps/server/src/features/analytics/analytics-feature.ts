import type { ClerkClient } from '@clerk/backend';
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
  GetWebSearchCallsQuery,
  GetSessionLengthDistributionQuery,
  GetToolCallsPerSessionQuery,
  GetToolTypeDistributionQuery,
  GetToolCallErrorsQuery,
} from './queries';
import type {
  GetOverviewStatsInput,
  GetUsageOverTimeInput,
  GetAgentDistributionInput,
  GetProviderDistributionInput,
  GetRecentActivityInput,
  GetUsersWithSessionsInput,
  GetTokensPerUserInput,
  GetSessionDetailInput,
  GetWebSearchCallsInput,
  GetSessionLengthDistributionInput,
  GetToolCallsPerSessionInput,
  GetToolTypeDistributionInput,
  GetToolCallErrorsInput,
} from './queries';
import { enrichWithClerkUserInfo } from '../shared';

/**
 * AnalyticsFeature - provides analytics queries for the admin dashboard
 */
export class AnalyticsFeature {
  private clerk: ClerkClient;
  private getOverviewStatsQuery: GetOverviewStatsQuery;
  private getUsageOverTimeQuery: GetUsageOverTimeQuery;
  private getAgentDistributionQuery: GetAgentDistributionQuery;
  private getProviderDistributionQuery: GetProviderDistributionQuery;
  private getRecentActivityQuery: GetRecentActivityQuery;
  private getUsersWithSessionsQuery: GetUsersWithSessionsQuery;
  private getTokensPerUserQuery: GetTokensPerUserQuery;
  private getSessionDetailQuery: GetSessionDetailQuery;
  private getWebSearchCallsQuery: GetWebSearchCallsQuery;
  private getSessionLengthDistributionQuery: GetSessionLengthDistributionQuery;
  private getToolCallsPerSessionQuery: GetToolCallsPerSessionQuery;
  private getToolTypeDistributionQuery: GetToolTypeDistributionQuery;
  private getToolCallErrorsQuery: GetToolCallErrorsQuery;

  constructor(
    db: typeof DbType,
    agentNames: Map<string, string>,
    clerk: ClerkClient
  ) {
    this.clerk = clerk;
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
    this.getWebSearchCallsQuery = new GetWebSearchCallsQuery(db);
    this.getSessionLengthDistributionQuery =
      new GetSessionLengthDistributionQuery(db);
    this.getToolCallsPerSessionQuery = new GetToolCallsPerSessionQuery(db);
    this.getToolTypeDistributionQuery = new GetToolTypeDistributionQuery(db);
    this.getToolCallErrorsQuery = new GetToolCallErrorsQuery(db);
  }

  getOverviewStats(input: GetOverviewStatsInput) {
    return this.getOverviewStatsQuery.execute(input);
  }

  getUsageOverTime(input: GetUsageOverTimeInput) {
    return this.getUsageOverTimeQuery.execute(input);
  }

  getAgentDistribution(input: GetAgentDistributionInput) {
    return this.getAgentDistributionQuery.execute(input);
  }

  getProviderDistribution(input: GetProviderDistributionInput) {
    return this.getProviderDistributionQuery.execute(input);
  }

  getRecentActivity(input: GetRecentActivityInput) {
    return this.getRecentActivityQuery.execute(input);
  }

  /**
   * Gets users with sessions, enriched with Clerk user info.
   */
  async getUsersWithSessions(input: GetUsersWithSessionsInput) {
    const users = await this.getUsersWithSessionsQuery.execute(input);
    return enrichWithClerkUserInfo(this.clerk, users);
  }

  /**
   * Gets token usage per user, enriched with Clerk user info.
   */
  async getTokensPerUser(input: GetTokensPerUserInput) {
    const data = await this.getTokensPerUserQuery.execute(input);
    return enrichWithClerkUserInfo(this.clerk, data);
  }

  getSessionDetail(input: GetSessionDetailInput) {
    return this.getSessionDetailQuery.execute(input);
  }

  /**
   * Gets web search calls, enriched with Clerk user info.
   */
  async getWebSearchCalls(input: GetWebSearchCallsInput) {
    const data = await this.getWebSearchCallsQuery.execute(input);
    return enrichWithClerkUserInfo(this.clerk, data);
  }

  getSessionLengthDistribution(input: GetSessionLengthDistributionInput) {
    return this.getSessionLengthDistributionQuery.execute(input);
  }

  getToolCallsPerSession(input: GetToolCallsPerSessionInput) {
    return this.getToolCallsPerSessionQuery.execute(input);
  }

  getToolTypeDistribution(input: GetToolTypeDistributionInput) {
    return this.getToolTypeDistributionQuery.execute(input);
  }

  getToolCallErrors(input: GetToolCallErrorsInput) {
    return this.getToolCallErrorsQuery.execute(input);
  }
}
