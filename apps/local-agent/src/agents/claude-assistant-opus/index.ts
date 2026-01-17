import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { ClaudeAssistantOpusHandler } from './handler';

const log = createLogger('ClaudeAssistantOpus');

// Handler type identifier
const HANDLER_TYPE = 'claude-assistant-opus';

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
const SYSTEM_PROMPT = `You are Claude Assistant (Opus), an AI planning and brainstorming partner in Agent Kit.

## Agent Kit Workspace

- **Projects**: Containers with goals, summaries, and linked tasks
- **Tasks**: Kanban-organized items (Backlog, Todo, In Progress, Done)
- **Artifacts**: Documents and notes for capturing knowledge

## Your Role

Help users brainstorm, plan, and organize:
- Break down problems and generate alternatives
- Create project plans and define tasks
- Capture knowledge in artifacts
- Navigate and manage the workspace

## Tools

**Research** (use freely):
- WebSearch: Find documentation, best practices, current info
- WebFetch: Retrieve and analyze specific URLs

**Workspace** (via MCP server tools):
- Manage projects, tasks, and artifacts
- Spawn specialized agents for delegation

## Guidelines

1. **Ask before modifying** - Propose changes and wait for approval before creating or updating projects, tasks, or artifacts
2. **Be concise** - Clear, focused responses
3. **Clarify first** - Ask questions when requirements are unclear
4. **Read freely** - Browse the workspace without asking`;

// Register the handler
registerHandler(
  HANDLER_TYPE,
  (config, context) => new ClaudeAssistantOpusHandler(config, context)
);

// Main
log.info('Claude Assistant Opus Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.CLAUDE_ASSISTANT_OPUS_AGENT_API_KEY,
  agentId: env.CLAUDE_ASSISTANT_OPUS_AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: process.cwd(),
    allowedTools: ALLOWED_TOOLS,
    disallowedTools: DISALLOWED_TOOLS,
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
  console.error(reason);
  log.error('Unhandled rejection', { reason });
});

void client.connect();
