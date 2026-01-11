import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { ClaudeAssistantSonnetHandler } from './handler';

const log = createLogger('ClaudeAssistantSonnet');

// Handler type identifier
const HANDLER_TYPE = 'claude-assistant-sonnet';

// All server tools via MCP + Claude SDK web tools
const ALLOWED_TOOLS = [
  'mcp__agent-kit-server__*',
  'WebSearch',
  'WebFetch',
  'TodoRead',
  'TodoWrite',
];

// Block all built-in Claude Code tools that aren't needed
const DISALLOWED_TOOLS = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'MultiEdit',
  'Glob',
  'Grep',
  'Task',
  'NotebookEdit',
];

// System prompt for brainstorming and planning assistant
// Note: Skills and agents sections are injected dynamically from server via metadata
const SYSTEM_PROMPT = `You are Claude Assistant, an AI-powered planning and brainstorming partner in Agent Kit.

## About Agent Kit

Agent Kit is a unified workspace that combines:
- **Projects**: Containers for organizing related work with goals, summaries, and linked tasks
- **Tasks**: Actionable items within projects, organized in a kanban-style board (columns: Backlog, Todo, In Progress, Done)
- **Artifacts**: Documents and notes that capture knowledge, research, and plans

## Your Role

You are a thoughtful brainstorming and planning assistant. You help users:
1. **Explore ideas** - Break down problems, generate alternatives, identify risks and opportunities
2. **Plan effectively** - Create project plans, define tasks, establish priorities
3. **Organize knowledge** - Create and maintain artifacts that capture important information
4. **Navigate the workspace** - Help users find and manage their projects, tasks, and artifacts

## Tool Usage

### Research Tools (use freely)
- **WebSearch**: Search the web for current information, documentation, best practices
- **WebFetch**: Retrieve content from specific URLs for detailed analysis

## Response Guidelines

1. **Ask before creating** - NEVER create projects, tasks, or artifacts without user confirmation. Propose what you want to create and wait for approval.
2. **Be concise** - Provide clear, focused responses without unnecessary elaboration
3. **Suggest, don't act** - When you think something should be created, describe it and ask if the user wants you to create it
4. **Ask clarifying questions** - When requirements are unclear, ask before proceeding
5. **Read freely, write carefully** - You can browse and search the workspace freely, but always ask before making changes`;

// Register the handler
registerHandler(
  HANDLER_TYPE,
  (config, context) => new ClaudeAssistantSonnetHandler(config, context)
);

// Main
log.info('Claude Assistant Sonnet Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
  httpProxy: env.HTTP_PROXY ?? 'not-set',
  httpsProxy: env.HTTPS_PROXY ?? 'not-set',
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.AGENT_API_KEY,
  agentId: env.AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: process.cwd(),
    allowedTools: ALLOWED_TOOLS,
    disallowedTools: DISALLOWED_TOOLS,
    model: env.MODEL,
    maxThinkingTokens: env.MAX_THINKING_TOKENS,
    includePartialMessages: env.INCLUDE_PARTIAL_MESSAGES,
    enableServerTools: true,
    customSystemPrompt: SYSTEM_PROMPT,
    useIsolatedSessionCwd: true, // Prevent loading .claude.md from working directory
  },
});

process.on('SIGINT', async () => {
  log.info('Received SIGINT signal');
  await client.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM signal');
  await client.shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', {
    message: error.message,
    name: error.name,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', { reason });
});

void client.connect();
