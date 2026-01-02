import type { db as DbType } from '../../db';
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
} from './commands';
import type { UpdateSessionUsageInput } from './commands/update-session-usage';
import {
  GetAgentQuery,
  ListAgentsQuery,
  HasAgentQuery,
  GetSessionByIdQuery,
  GetSessionByIdForUserQuery,
  GetAgentIdForSessionQuery,
  GetSessionWithMessagesQuery,
  ListSessionsByUserQuery,
  VerifySessionOwnershipQuery,
  GetMessagesBySessionIdQuery,
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

// Default agents - hardcoded for now, will be loaded from DB in the future
const DEFAULT_AGENTS: AgentDefinition[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'A helpful AI assistant for general tasks',
    systemPrompt: `You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you're doing when using tools

Be friendly but professional.`,
    provider: 'openai',
    model: 'gpt-4o',
    tools: ['getTime'],
  },
  {
    id: 'gemini-assistant',
    name: 'Gemini Assistant',
    description: 'A fast AI assistant powered by Google Gemini',
    systemPrompt: `You are a helpful AI assistant powered by Google Gemini. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you're doing when using tools

Be friendly but professional.`,
    provider: 'gemini',
    model: 'gemini-3-flash-preview',
    tools: ['getTime'],
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

  // Queries
  private getAgentQuery: GetAgentQuery;
  private listAgentsQuery: ListAgentsQuery;
  private hasAgentQuery: HasAgentQuery;
  private getSessionByIdQuery: GetSessionByIdQuery;
  private getSessionByIdForUserQuery: GetSessionByIdForUserQuery;
  private getAgentIdForSessionQuery: GetAgentIdForSessionQuery;
  private getSessionWithMessagesQuery: GetSessionWithMessagesQuery;
  private listSessionsByUserQuery: ListSessionsByUserQuery;
  private verifySessionOwnershipQuery: VerifySessionOwnershipQuery;
  private getMessagesBySessionIdQuery: GetMessagesBySessionIdQuery;

  constructor(db: typeof DbType) {
    // Initialize agents map with defaults
    this.agentsMap = new Map();
    for (const agent of DEFAULT_AGENTS) {
      this.agentsMap.set(agent.id, agent);
    }

    // Initialize commands
    this.registerAgentCommand = new RegisterAgentCommand(this.agentsMap);
    this.updateAgentCommand = new UpdateAgentCommand(this.agentsMap);
    this.deleteAgentCommand = new DeleteAgentCommand(this.agentsMap);
    this.createSessionCommand = new CreateSessionCommand(db);
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
    this.getSessionWithMessagesQuery = new GetSessionWithMessagesQuery(db);
    this.listSessionsByUserQuery = new ListSessionsByUserQuery(db);
    this.verifySessionOwnershipQuery = new VerifySessionOwnershipQuery(db);
    this.getMessagesBySessionIdQuery = new GetMessagesBySessionIdQuery(db);
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
      listByUser: (userId: string, limit: number) =>
        this.listSessionsByUserQuery.execute(userId, limit),
      getAgentId: (sessionId: string) =>
        this.getAgentIdForSessionQuery.execute(sessionId),
      verifyOwnership: (sessionId: string, userId: string) =>
        this.verifySessionOwnershipQuery.execute(sessionId, userId),
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
}
