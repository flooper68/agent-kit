import type { db as DbType } from '../../db';
import type { StreamingStateManager } from '../../agent/streaming-state-manager';
import type { SessionSummarizer } from '../../agent/session-summarizer';
import type { CacheInvalidationService } from '../../real-time';
import {
  CreateSessionCommand,
  UpdateSessionTitleCommand,
  UpdateSessionTimestampCommand,
  UpdateSessionSummaryCommand,
  UpdateSessionUsageCommand,
  IncrementMessageCountCommand,
  DeleteSessionCommand,
  CreateMessageCommand,
  UpdateMessageStatusCommand,
  InsertEventCommand,
  SendUserMessageCommand,
  CompleteMessageCommand,
  TriggerSummarizationCommand,
  InterruptSessionCommand,
  CreateExternalAgentCommand,
  CreateServerAgentCommand,
  UpdateCustomAgentCommand,
  SetAgentDisabledCommand,
  RegenerateAgentKeyCommand,
  ToggleAgentFavoriteCommand,
  DeleteCustomAgentCommand,
} from './commands';
import type {
  CreateSessionInput,
  UpdateSessionTitleInput,
  UpdateSessionSummaryInput,
  UpdateSessionUsageInput,
  CreateMessageInput,
  UpdateMessageStatusInput,
  InsertEventInput,
  SendUserMessageInput,
  SendUserMessageResult,
  CompleteMessageInput,
  CompleteMessageResult,
  TriggerSummarizationInput,
  TriggerSummarizationResult,
  InterruptSessionDeps,
  InterruptSessionInput,
  CreateExternalAgentInput,
  CreateServerAgentInput,
  UpdateCustomAgentInput,
} from './commands';
import {
  GetSessionByIdQuery,
  GetSessionByIdForUserQuery,
  GetAgentIdForSessionQuery,
  GetSessionAgentInfoQuery,
  GetSessionWithMessagesQuery,
  ListSessionsByUserQuery,
  VerifySessionOwnershipQuery,
  GetMessagesBySessionIdQuery,
  GetSessionResourcesQuery,
  GetSessionMessagesAndEventsQuery,
  GetActiveSessionIdsQuery,
  GetSessionChildrenQuery,
  GetSessionLineageQuery,
  ListAgentsForUserQuery,
  ListExternalAgentsQuery,
  ListServerAgentsQuery,
  ListActiveAgentsQuery,
  GetCustomAgentByIdQuery,
  GetAgentByKeyQuery,
  ValidateAgentKeyQuery,
  FindAgentByKeyPrefixQuery,
  ListAgentsForSelectorQuery,
  GetAgentForSelectorQuery,
  ListModelsQuery,
} from './queries';

/**
 * AgentsFeature - main class that composes all command and query handlers
 * for agent-related database operations
 */
export class AgentsFeature {
  // Cache invalidation service (optional, set via setAgentCacheInvalidation)
  private agentCacheInvalidation?: CacheInvalidationService;

  // Commands
  private createSessionCommand: CreateSessionCommand;
  private updateSessionTitleCommand: UpdateSessionTitleCommand;
  private updateSessionTimestampCommand: UpdateSessionTimestampCommand;
  private updateSessionSummaryCommand: UpdateSessionSummaryCommand;
  private updateSessionUsageCommand: UpdateSessionUsageCommand;
  private incrementMessageCountCommand: IncrementMessageCountCommand;
  private deleteSessionCommand: DeleteSessionCommand;
  private createMessageCommand: CreateMessageCommand;
  private updateMessageStatusCommand: UpdateMessageStatusCommand;
  private insertEventCommand: InsertEventCommand;

  // Orchestration commands
  private sendUserMessageCommand: SendUserMessageCommand;
  private completeMessageCommand: CompleteMessageCommand;

  // Late-initialized commands (require infrastructure dependencies)
  private triggerSummarizationCommand?: TriggerSummarizationCommand;
  private interruptSessionCommand?: InterruptSessionCommand;

  // Custom agent commands
  private createExternalAgentCommand: CreateExternalAgentCommand;
  private createServerAgentCommand: CreateServerAgentCommand;
  private updateCustomAgentCommand: UpdateCustomAgentCommand;
  private setAgentDisabledCommand: SetAgentDisabledCommand;
  private regenerateAgentKeyCommand: RegenerateAgentKeyCommand;
  private toggleAgentFavoriteCommand: ToggleAgentFavoriteCommand;
  private deleteCustomAgentCommand: DeleteCustomAgentCommand;

  // Queries
  private getSessionByIdQuery: GetSessionByIdQuery;
  private getSessionByIdForUserQuery: GetSessionByIdForUserQuery;
  private getAgentIdForSessionQuery: GetAgentIdForSessionQuery;
  private getSessionAgentInfoQuery: GetSessionAgentInfoQuery;
  private getSessionWithMessagesQuery: GetSessionWithMessagesQuery;
  private listSessionsByUserQuery: ListSessionsByUserQuery;
  private verifySessionOwnershipQuery: VerifySessionOwnershipQuery;
  private getMessagesBySessionIdQuery: GetMessagesBySessionIdQuery;
  private getSessionResourcesQuery: GetSessionResourcesQuery;
  private getSessionMessagesAndEventsQuery: GetSessionMessagesAndEventsQuery;

  // Late-initialized queries (require infrastructure dependencies)
  private getActiveSessionIdsQuery?: GetActiveSessionIdsQuery;

  // Session hierarchy queries
  private getSessionChildrenQuery: GetSessionChildrenQuery;
  private getSessionLineageQuery: GetSessionLineageQuery;

  // Custom agent queries
  private listAgentsForUserQuery: ListAgentsForUserQuery;
  private listExternalAgentsQuery: ListExternalAgentsQuery;
  private listServerAgentsQuery: ListServerAgentsQuery;
  private listActiveAgentsQuery: ListActiveAgentsQuery;
  private getCustomAgentByIdQuery: GetCustomAgentByIdQuery;
  private getAgentByKeyQuery: GetAgentByKeyQuery;
  private validateAgentKeyQuery: ValidateAgentKeyQuery;
  private findAgentByKeyPrefixQuery: FindAgentByKeyPrefixQuery;

  // Agent selector queries (for UI dropdown)
  private listAgentsForSelectorQuery: ListAgentsForSelectorQuery;
  private getAgentForSelectorQuery: GetAgentForSelectorQuery;

  // Model queries
  private listModelsQuery: ListModelsQuery;

  constructor(db: typeof DbType) {
    // Initialize commands
    this.createSessionCommand = new CreateSessionCommand(db, {
      hasBuiltInAgent: () => false, // No more builtin agents
      getAgent: async (key, userId) => {
        const result = await this.getAgentByKeyQuery.execute({ key, userId });
        if (!result) return null;
        return { disabled: result.agent.disabled };
      },
    });
    this.updateSessionTitleCommand = new UpdateSessionTitleCommand(db);
    this.updateSessionTimestampCommand = new UpdateSessionTimestampCommand(db);
    this.updateSessionSummaryCommand = new UpdateSessionSummaryCommand(db);
    this.updateSessionUsageCommand = new UpdateSessionUsageCommand(db);
    this.incrementMessageCountCommand = new IncrementMessageCountCommand(db);
    this.deleteSessionCommand = new DeleteSessionCommand(db);
    this.createMessageCommand = new CreateMessageCommand(db);
    this.updateMessageStatusCommand = new UpdateMessageStatusCommand(db);
    this.insertEventCommand = new InsertEventCommand(db);

    // Initialize custom agent commands
    this.createExternalAgentCommand = new CreateExternalAgentCommand(db);
    this.createServerAgentCommand = new CreateServerAgentCommand(db);
    this.updateCustomAgentCommand = new UpdateCustomAgentCommand(db);
    this.setAgentDisabledCommand = new SetAgentDisabledCommand(db);
    this.regenerateAgentKeyCommand = new RegenerateAgentKeyCommand(db);
    this.toggleAgentFavoriteCommand = new ToggleAgentFavoriteCommand(db);
    this.deleteCustomAgentCommand = new DeleteCustomAgentCommand(db);

    // Initialize queries
    this.getSessionByIdQuery = new GetSessionByIdQuery(db);
    this.getSessionByIdForUserQuery = new GetSessionByIdForUserQuery(db);
    this.getAgentIdForSessionQuery = new GetAgentIdForSessionQuery(db);
    this.getSessionAgentInfoQuery = new GetSessionAgentInfoQuery(db);
    this.getSessionWithMessagesQuery = new GetSessionWithMessagesQuery(
      db,
      new Map() // Agent names looked up from DB, no builtin agents
    );
    this.listSessionsByUserQuery = new ListSessionsByUserQuery(db);
    this.verifySessionOwnershipQuery = new VerifySessionOwnershipQuery(db);
    this.getMessagesBySessionIdQuery = new GetMessagesBySessionIdQuery(db);
    this.getSessionResourcesQuery = new GetSessionResourcesQuery(db);
    this.getSessionMessagesAndEventsQuery =
      new GetSessionMessagesAndEventsQuery(db);

    // Initialize session hierarchy queries
    this.getSessionChildrenQuery = new GetSessionChildrenQuery(db);
    this.getSessionLineageQuery = new GetSessionLineageQuery(db);

    // Initialize custom agent queries
    this.listAgentsForUserQuery = new ListAgentsForUserQuery(db);
    this.listExternalAgentsQuery = new ListExternalAgentsQuery(db);
    this.listServerAgentsQuery = new ListServerAgentsQuery(db);
    this.listActiveAgentsQuery = new ListActiveAgentsQuery(db);
    this.getCustomAgentByIdQuery = new GetCustomAgentByIdQuery(db);
    this.getAgentByKeyQuery = new GetAgentByKeyQuery(db);
    this.validateAgentKeyQuery = new ValidateAgentKeyQuery(db);
    this.findAgentByKeyPrefixQuery = new FindAgentByKeyPrefixQuery(db);

    // Initialize agent selector queries (for UI dropdown)
    this.listAgentsForSelectorQuery = new ListAgentsForSelectorQuery(db);
    this.getAgentForSelectorQuery = new GetAgentForSelectorQuery(db);

    // Initialize model queries
    this.listModelsQuery = new ListModelsQuery();

    // Initialize orchestration commands (compose existing commands)
    this.sendUserMessageCommand = new SendUserMessageCommand(
      this.createMessageCommand,
      this.insertEventCommand,
      this.updateSessionTimestampCommand,
      this.incrementMessageCountCommand
    );

    this.completeMessageCommand = new CompleteMessageCommand(
      this.updateMessageStatusCommand,
      this.updateSessionUsageCommand,
      this.incrementMessageCountCommand
    );
  }

  /**
   * Set the SessionSummarizer for late initialization of summarization command
   * Must be called after Redis-dependent services are ready
   */
  setSummarizer(
    summarizer: SessionSummarizer,
    cacheInvalidation: CacheInvalidationService
  ): void {
    this.triggerSummarizationCommand = new TriggerSummarizationCommand(
      summarizer,
      this.getSessionWithMessagesQuery,
      this.updateSessionSummaryCommand,
      cacheInvalidation
    );
  }

  /**
   * Set the StreamingStateManager for late initialization of streaming queries
   * Must be called after Redis-dependent services are ready
   */
  setStreamingStateManager(streamingStateManager: StreamingStateManager): void {
    this.getActiveSessionIdsQuery = new GetActiveSessionIdsQuery(
      streamingStateManager
    );
  }

  /**
   * Set dependencies for interrupt session command
   * Must be called after Redis-dependent services are ready
   */
  setInterruptDependencies(deps: InterruptSessionDeps): void {
    this.interruptSessionCommand = new InterruptSessionCommand(deps);
  }

  /**
   * Set the CacheInvalidationService for agent cache invalidation
   * Must be called after Redis-dependent services are ready
   */
  setAgentCacheInvalidation(service: CacheInvalidationService): void {
    this.agentCacheInvalidation = service;
  }

  /**
   * Session operations
   */
  get sessions() {
    return {
      create: (input: CreateSessionInput) =>
        this.createSessionCommand.execute(input),
      updateTitle: (input: UpdateSessionTitleInput) =>
        this.updateSessionTitleCommand.execute(input),
      updateTimestamp: (sessionId: string) =>
        this.updateSessionTimestampCommand.execute({ sessionId }),
      updateSummary: (input: UpdateSessionSummaryInput) =>
        this.updateSessionSummaryCommand.execute(input),
      updateUsage: (input: UpdateSessionUsageInput) =>
        this.updateSessionUsageCommand.execute(input),
      incrementMessageCount: (sessionId: string) =>
        this.incrementMessageCountCommand.execute({ sessionId }),
      delete: (sessionId: string) =>
        this.deleteSessionCommand.execute({ sessionId }),
      getById: (sessionId: string) =>
        this.getSessionByIdQuery.execute({ sessionId }),
      getByIdForUser: (sessionId: string, userId: string) =>
        this.getSessionByIdForUserQuery.execute({ sessionId, userId }),
      getWithMessages: (sessionId: string) =>
        this.getSessionWithMessagesQuery.execute({ sessionId }),
      listByUser: (
        userId: string,
        limit: number,
        filter?: 'my_chats' | 'all' | 'sub_agents',
        cursor?: string
      ) =>
        this.listSessionsByUserQuery.execute({ userId, limit, filter, cursor }),
      getAgentId: (sessionId: string) =>
        this.getAgentIdForSessionQuery.execute({ sessionId }),
      getAgentInfo: (sessionId: string) =>
        this.getSessionAgentInfoQuery.execute(sessionId),
      verifyOwnership: (sessionId: string, userId: string, orgId?: string) =>
        this.verifySessionOwnershipQuery.execute({ sessionId, userId, orgId }),
      getResources: (sessionId: string) =>
        this.getSessionResourcesQuery.execute(sessionId),
      getMessagesAndEvents: (sessionId: string) =>
        this.getSessionMessagesAndEventsQuery.execute(sessionId),
      getChildren: (sessionId: string, userId: string) =>
        this.getSessionChildrenQuery.execute({ sessionId, userId }),
      getLineage: (sessionId: string, userId: string) =>
        this.getSessionLineageQuery.execute(sessionId, userId),
      interrupt: (input: InterruptSessionInput) => {
        if (!this.interruptSessionCommand) {
          throw new Error('Interrupt dependencies not initialized');
        }
        return this.interruptSessionCommand.execute(input);
      },
    };
  }

  /**
   * Message operations
   */
  get messages() {
    return {
      create: (input: CreateMessageInput) =>
        this.createMessageCommand.execute(input),
      updateStatus: (input: UpdateMessageStatusInput) =>
        this.updateMessageStatusCommand.execute(input),
      getBySessionId: (sessionId: string) =>
        this.getMessagesBySessionIdQuery.execute({ sessionId }),
    };
  }

  /**
   * Event operations
   */
  get events() {
    return {
      insert: (event: InsertEventInput) =>
        this.insertEventCommand.execute(event),
    };
  }

  /**
   * Message lifecycle orchestration
   * Higher-level operations that compose multiple commands
   */
  get messageLifecycle() {
    return {
      /**
       * Send a user message and create assistant placeholder
       * Creates user message, inserts text event, creates streaming assistant message
       */
      sendUserMessage: (
        input: SendUserMessageInput
      ): Promise<SendUserMessageResult> =>
        this.sendUserMessageCommand.execute(input),

      /**
       * Complete an assistant message with usage tracking
       * Updates message status, session usage, and increments message count
       */
      completeMessage: (
        input: CompleteMessageInput
      ): Promise<CompleteMessageResult> =>
        this.completeMessageCommand.execute(input),
    };
  }

  /**
   * Session summarization operations
   */
  get summarization() {
    return {
      /**
       * Check if summarization should be triggered for given message count
       */
      shouldTrigger: (messageCount: number): boolean => {
        if (!this.triggerSummarizationCommand) {
          return false;
        }
        return this.triggerSummarizationCommand.shouldTrigger(messageCount);
      },

      /**
       * Trigger session summarization if threshold is met
       */
      trigger: (
        input: TriggerSummarizationInput
      ): Promise<TriggerSummarizationResult> => {
        if (!this.triggerSummarizationCommand) {
          return Promise.resolve({ summarized: false });
        }
        return this.triggerSummarizationCommand.execute(input);
      },
    };
  }

  /**
   * Streaming status operations
   */
  get streaming() {
    return {
      /**
       * Get all session IDs with active streaming jobs
       */
      getActiveSessionIds: (): Promise<Set<string>> => {
        if (!this.getActiveSessionIdsQuery) {
          return Promise.resolve(new Set());
        }
        return this.getActiveSessionIdsQuery.execute();
      },
    };
  }

  /**
   * Custom agent operations (user-created agents stored in DB)
   */
  get customAgents() {
    return {
      createExternal: async (input: CreateExternalAgentInput) => {
        const result = await this.createExternalAgentCommand.execute(input);
        await this.agentCacheInvalidation?.publishAgentCreated(
          input.userId,
          result.agent.id
        );
        return result;
      },
      createServer: async (input: CreateServerAgentInput) => {
        const result = await this.createServerAgentCommand.execute(input);
        await this.agentCacheInvalidation?.publishAgentCreated(
          input.userId,
          result.id
        );
        return result;
      },
      list: (userId: string) =>
        this.listAgentsForUserQuery.execute({ userId }),
      listExternal: (userId: string) =>
        this.listExternalAgentsQuery.execute({ userId }),
      listServer: (userId: string) =>
        this.listServerAgentsQuery.execute({ userId }),
      listActive: (userId: string) =>
        this.listActiveAgentsQuery.execute({ userId }),
      getById: (id: string, userId: string) =>
        this.getCustomAgentByIdQuery.execute({ id, userId }),
      getByKey: (key: string, userId: string) =>
        this.getAgentByKeyQuery.execute({ key, userId }),
      update: async (input: UpdateCustomAgentInput) => {
        const result = await this.updateCustomAgentCommand.execute(input);
        if (result) {
          await this.agentCacheInvalidation?.publishAgentUpdated(
            input.userId,
            result.id
          );
        }
        return result;
      },
      setDisabled: async (
        id: string,
        userId: string,
        disabled: boolean,
        agentType: 'external' | 'server'
      ) => {
        const result = await this.setAgentDisabledCommand.execute({
          id,
          userId,
          disabled,
          agentType,
        });
        if (result) {
          await this.agentCacheInvalidation?.publishAgentUpdated(userId, id);
        }
        return result;
      },
      regenerateKey: (id: string, userId: string) =>
        this.regenerateAgentKeyCommand.execute({ id, userId }),
      validateKey: (secretKey: string) =>
        this.validateAgentKeyQuery.execute({ secretKey }),
      findByKeyPrefix: (prefix: string) =>
        this.findAgentByKeyPrefixQuery.execute({ prefix }),
      toggleFavorite: async (
        id: string,
        userId: string,
        isFavorite: boolean,
        agentType: 'external' | 'server'
      ) => {
        const result = await this.toggleAgentFavoriteCommand.execute({
          id,
          userId,
          isFavorite,
          agentType,
        });
        if (result) {
          await this.agentCacheInvalidation?.publishAgentUpdated(userId, id);
        }
        return result;
      },
      delete: async (
        id: string,
        userId: string,
        agentType: 'external' | 'server'
      ) => {
        const result = await this.deleteCustomAgentCommand.execute({
          id,
          userId,
          agentType,
        });
        if (result) {
          await this.agentCacheInvalidation?.publishAgentDeleted(userId, id);
        }
        return result;
      },
    };
  }

  /**
   * Agent selector operations (for UI dropdown)
   * Returns active agents formatted for display in agent selector
   */
  get agentSelector() {
    return {
      list: (userId: string) =>
        this.listAgentsForSelectorQuery.execute({ userId }),
      get: (key: string, userId: string) =>
        this.getAgentForSelectorQuery.execute({ key, userId }),
    };
  }

  /**
   * Model operations
   * Returns available models and providers
   */
  get models() {
    return {
      list: (provider?: 'anthropic' | 'openai' | 'gemini') =>
        this.listModelsQuery.execute({ provider }),
    };
  }
}
