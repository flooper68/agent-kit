import type { db as DbType } from '../../db';
import type { LocalAgentsFeature } from '../local-agents';
import type { StreamingStateManager } from '../../agent/streaming-state-manager';
import type { SessionSummarizer } from '../../agent/session-summarizer';
import type { CacheInvalidationService } from '../../real-time';
import {
  RegisterAgentCommand,
  UpdateAgentCommand,
  DeleteAgentCommand,
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
} from './commands';
import type { UpdateSessionUsageInput } from './commands/update-session-usage';
import type {
  SendUserMessageInput,
  SendUserMessageResult,
} from './commands/send-user-message';
import type {
  CompleteMessageInput,
  CompleteMessageResult,
} from './commands/complete-message';
import type {
  TriggerSummarizationInput,
  TriggerSummarizationResult,
} from './commands/trigger-summarization';
import {
  GetAgentQuery,
  ListAgentsQuery,
  HasAgentQuery,
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
} from './queries';
import type {
  AgentDefinition,
  CreateSessionInput,
  UpdateSessionTitleInput,
  UpdateSessionSummaryInput,
  CreateMessageInput,
  UpdateMessageStatusInput,
  NewAgentSessionEvent,
} from './types';

// Standard tools available to all agents
const STANDARD_TOOLS = [
  // Utility tools
  'getTime',
  'webSearch',
  'extractContent',
  'fetch',
  // Artifact tools
  'writeArtifact',
  'searchArtifacts',
  'readArtifact',
  // Planning tools - projects
  'listProjects',
  'searchProjects',
  'getProject',
  'createProject',
  'updateProject',
  // Planning tools - tasks
  'listTasks',
  'searchTasks',
  'getTask',
  'createTask',
  'updateTask',
  'moveTask',
  'reorderTask',
  'attachArtifactToTask',
  'detachArtifactFromTask',
  // Client-side tools
  'navigateTo',
  'getCurrentUIState',
  // Agent spawning
  'spawnAgent',
];

// Standard system prompt for all assistants
const STANDARD_SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, accurate, and helpful.

IMPORTANT - Before creating or deleting resources:
- Confirm with the user before creating new projects, tasks, or artifacts
- Confirm before deleting any resources
- You may search, read, and update existing resources without asking
- Ask clarifying questions if the user's request is ambiguous

Before creating new resources:
- ALWAYS search for existing resources first to avoid duplicates
- Before createProject: use searchProjects or listProjects to check if a similar project exists
- Before createTask: use searchTasks or listTasks to check if a similar task exists
- Before writeArtifact: use searchArtifacts to check if a similar document exists
- If something similar exists, ask the user if they want to update it or create a new one

When using tools:
- Use getTime when asked about the current date or time
- Use webSearch to find current information from the web
- Use extractContent to get full article text from URLs
- Use fetch to retrieve raw content from any URL
- Use searchArtifacts to find previously saved documents by title or summary
- Use readArtifact to retrieve the full content of a saved document
- Use writeArtifact to save documents, notes, or any content the user asks you to save
- Explain what you're doing when using tools

For project and task management:
- Use listProjects to see all available projects
- Use searchProjects to find projects by name or description
- Use getProject to get details about a specific project
- Use listTasks to see tasks in a project (can filter by status, priority, overdue, etc.)
- Use searchTasks to find tasks across all projects
- Use getTask to see full task details including attached artifacts
- Use createTask to add new tasks to a project (after checking for duplicates)
- Use updateTask to modify task title, description, priority, or due date
- Use moveTask to change a task's status (todo, in_progress, review, done)
- Use reorderTask to change a task's position within its current column
- Use attachArtifactToTask to link a document to a task
- Use detachArtifactFromTask to remove a document link from a task

For UI navigation:
- Use navigateTo to navigate the user's browser to a specific app route (e.g., "/app/projects")
- Use getCurrentUIState to check what page/section the user is currently viewing

Be friendly but professional.`;

// Default agents - hardcoded for now, will be loaded from DB in the future
// Ordered by release date, newest first
const DEFAULT_AGENTS: AgentDefinition[] = [
  // November 2025
  {
    id: 'assistant-gpt-5.2',
    name: 'Assistant - GPT-5.2',
    description: 'Most capable OpenAI model with advanced reasoning',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-5.2',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-11-15'),
  },
  {
    id: 'assistant-gpt-5.2-codex',
    name: 'Assistant - GPT-5.2 Codex',
    description: 'Specialized for code generation and analysis',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-5.2-codex',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-11-15'),
  },
  {
    id: 'assistant-opus-4.5',
    name: 'Assistant - Opus 4.5',
    description: 'Most capable Anthropic model for complex tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-11-01'),
  },
  // October 2025
  {
    id: 'assistant-gemini-3-pro',
    name: 'Assistant - Gemini 3 Pro',
    description: 'Most capable Google model for complex reasoning',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-3-pro-preview',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-10-20'),
  },
  {
    id: 'assistant-gemini-3-flash',
    name: 'Assistant - Gemini 3 Flash',
    description: 'Fast and efficient Google assistant',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-3-flash-preview',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-10-20'),
  },
  {
    id: 'assistant-haiku-4.5',
    name: 'Assistant - Haiku 4.5',
    description: 'Fast and efficient for quick tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-10-01'),
  },
  // September 2025
  {
    id: 'assistant-sonnet-4.5',
    name: 'Assistant - Sonnet 4.5',
    description: 'Balanced performance and intelligence',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-09-29'),
  },
  {
    id: 'assistant-gpt-5',
    name: 'Assistant - GPT-5',
    description: 'Powerful OpenAI model for complex tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-5',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-09-15'),
  },
  {
    id: 'assistant-gpt-5-mini',
    name: 'Assistant - GPT-5 Mini',
    description: 'Balanced performance and cost efficiency',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-5-mini',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-09-15'),
  },
  {
    id: 'assistant-gpt-5-nano',
    name: 'Assistant - GPT-5 Nano',
    description: 'Ultra-fast and cost-effective for simple tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-5-nano',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-09-15'),
  },
  // August 2025
  {
    id: 'assistant-opus-4.1',
    name: 'Assistant - Opus 4.1',
    description: 'Premium Anthropic model for demanding tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-opus-4-1-20250805',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-08-05'),
  },
  // June 2025
  {
    id: 'assistant-gemini-2.5-pro',
    name: 'Assistant - Gemini 2.5 Pro',
    description: 'Powerful model for advanced tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-06-15'),
  },
  {
    id: 'assistant-gemini-2.5-flash',
    name: 'Assistant - Gemini 2.5 Flash',
    description: 'Quick responses for everyday use',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-06-15'),
  },
  {
    id: 'assistant-gemini-2.5-flash-lite',
    name: 'Assistant - Gemini 2.5 Flash-Lite',
    description: 'Ultra-lightweight and cost-effective',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-06-15'),
  },
  // May 2025
  {
    id: 'assistant-sonnet-4',
    name: 'Assistant - Sonnet 4',
    description: 'Reliable performance for everyday tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-05-14'),
  },
  // April 2025
  {
    id: 'assistant-o3',
    name: 'Assistant - o3',
    description: 'OpenAI reasoning model for complex problem solving',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'o3',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-04-16'),
  },
  {
    id: 'assistant-o4-mini',
    name: 'Assistant - o4-mini',
    description: 'Compact reasoning model for efficient analysis',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'o4-mini',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2025-04-16'),
  },
  // December 2024
  {
    id: 'assistant-gemini-2.0-flash',
    name: 'Assistant - Gemini 2.0 Flash',
    description: 'Fast legacy model for simple tasks',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2024-12-10'),
  },
  // October 2024
  {
    id: 'assistant-haiku-3.5',
    name: 'Assistant - Haiku 3.5',
    description: 'Quick and affordable assistant',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2024-10-22'),
  },
  // July 2024
  {
    id: 'assistant-gpt-4o-mini',
    name: 'Assistant - GPT-4o Mini',
    description: 'Fast and affordable multimodal assistant',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-4o-mini',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2024-07-18'),
  },
  // May 2024
  {
    id: 'assistant-gpt-4o',
    name: 'Assistant - GPT-4o',
    description: 'Multimodal model with vision capabilities',
    systemPrompt: STANDARD_SYSTEM_PROMPT,
    provider: 'openai',
    model: 'gpt-4o',
    tools: STANDARD_TOOLS,
    releasedAt: new Date('2024-05-13'),
  },
];

/**
 * AgentsFeature - main class that composes all command and query handlers
 * for agent-related database operations
 */
export class AgentsFeature {
  // In-memory agent storage (prepared for future DB migration)
  private agentsMap: Map<string, AgentDefinition>;

  // Commands
  private registerAgentCommand: RegisterAgentCommand;
  private updateAgentCommand: UpdateAgentCommand;
  private deleteAgentCommand: DeleteAgentCommand;
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

  // New orchestration commands (initialized in constructor)
  private sendUserMessageCommand: SendUserMessageCommand;
  private completeMessageCommand: CompleteMessageCommand;

  // Late-initialized commands (require infrastructure dependencies)
  private triggerSummarizationCommand?: TriggerSummarizationCommand;

  // Queries
  private getAgentQuery: GetAgentQuery;
  private listAgentsQuery: ListAgentsQuery;
  private hasAgentQuery: HasAgentQuery;
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

  constructor(db: typeof DbType, localAgentsFeature: LocalAgentsFeature) {
    // Initialize agents map with defaults
    this.agentsMap = new Map();
    for (const agent of DEFAULT_AGENTS) {
      this.agentsMap.set(agent.id, agent);
    }

    // Initialize commands
    this.registerAgentCommand = new RegisterAgentCommand(this.agentsMap);
    this.updateAgentCommand = new UpdateAgentCommand(this.agentsMap);
    this.deleteAgentCommand = new DeleteAgentCommand(this.agentsMap);
    this.createSessionCommand = new CreateSessionCommand(db, {
      hasBuiltInAgent: (id) => this.agentsMap.has(id),
      getLocalAgent: (key, userId) => localAgentsFeature.getByKey(key, userId),
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

    // Initialize queries
    this.getAgentQuery = new GetAgentQuery(this.agentsMap);
    this.listAgentsQuery = new ListAgentsQuery(this.agentsMap);
    this.hasAgentQuery = new HasAgentQuery(this.agentsMap);
    this.getSessionByIdQuery = new GetSessionByIdQuery(db);
    this.getSessionByIdForUserQuery = new GetSessionByIdForUserQuery(db);
    this.getAgentIdForSessionQuery = new GetAgentIdForSessionQuery(db);
    this.getSessionAgentInfoQuery = new GetSessionAgentInfoQuery(db);
    // Create agentNames map for name lookups
    const agentNames = new Map<string, string>();
    for (const [id, agent] of this.agentsMap) {
      agentNames.set(id, agent.name);
    }
    this.getSessionWithMessagesQuery = new GetSessionWithMessagesQuery(
      db,
      agentNames
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
   * Agent operations
   */
  get agents() {
    return {
      get: (id: string) => this.getAgentQuery.execute(id),
      list: () => this.listAgentsQuery.execute(),
      has: (id: string) => this.hasAgentQuery.execute(id),
      register: (agent: AgentDefinition) =>
        this.registerAgentCommand.execute(agent),
      update: (id: string, updates: Partial<Omit<AgentDefinition, 'id'>>) =>
        this.updateAgentCommand.execute(id, updates),
      delete: (id: string) => this.deleteAgentCommand.execute(id),
    };
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
        this.updateSessionTimestampCommand.execute(sessionId),
      updateSummary: (input: UpdateSessionSummaryInput) =>
        this.updateSessionSummaryCommand.execute(input),
      updateUsage: (input: UpdateSessionUsageInput) =>
        this.updateSessionUsageCommand.execute(input),
      incrementMessageCount: (sessionId: string) =>
        this.incrementMessageCountCommand.execute(sessionId),
      delete: (sessionId: string) =>
        this.deleteSessionCommand.execute(sessionId),
      getById: (sessionId: string) =>
        this.getSessionByIdQuery.execute(sessionId),
      getByIdForUser: (sessionId: string, userId: string) =>
        this.getSessionByIdForUserQuery.execute(sessionId, userId),
      getWithMessages: (sessionId: string) =>
        this.getSessionWithMessagesQuery.execute(sessionId),
      listByUser: (
        userId: string,
        limit: number,
        filter?: 'my_chats' | 'all' | 'sub_agents',
        cursor?: string
      ) =>
        this.listSessionsByUserQuery.execute({ userId, limit, filter, cursor }),
      getAgentId: (sessionId: string) =>
        this.getAgentIdForSessionQuery.execute(sessionId),
      getAgentInfo: (sessionId: string) =>
        this.getSessionAgentInfoQuery.execute(sessionId),
      verifyOwnership: (sessionId: string, userId: string, orgId?: string) =>
        this.verifySessionOwnershipQuery.execute(sessionId, userId, orgId),
      getResources: (sessionId: string) =>
        this.getSessionResourcesQuery.execute(sessionId),
      getMessagesAndEvents: (sessionId: string) =>
        this.getSessionMessagesAndEventsQuery.execute(sessionId),
      getChildren: (sessionId: string) =>
        this.getSessionChildrenQuery.execute(sessionId),
      getLineage: (sessionId: string, userId: string) =>
        this.getSessionLineageQuery.execute(sessionId, userId),
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
        this.getMessagesBySessionIdQuery.execute(sessionId),
    };
  }

  /**
   * Event operations
   */
  get events() {
    return {
      insert: (event: NewAgentSessionEvent) =>
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
}
