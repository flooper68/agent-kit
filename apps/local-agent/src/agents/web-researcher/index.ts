import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { WebResearcherHandler } from './handler';

const log = createLogger('WebResearcher');

// Handler type identifier
const HANDLER_TYPE = 'web-researcher';

// Web-specific tools + artifact write tool via server MCP
const ALLOWED_TOOLS = [
  'mcp__agent-kit-server__*',

  'WebFetch',
  'WebSearch',

  'TodoRead',
  'TodoWrite',
];

// Block all built-in Claude Code tools that aren't needed
const DISALLOWED_TOOLS = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Task',
  'NotebookEdit',
];

// System prompt for focused web research with artifact output
const SYSTEM_PROMPT = `You are a web research assistant. You MUST call writeArtifact at the end of every task.

## Workflow

1. Plan: Create a todo list with research steps
2. Search: Use WebSearch to find relevant sources
3. Fetch: Use WebFetch on 2-4 promising URLs
4. Save: Call writeArtifact with synthesized findings (MANDATORY)

## Learning How to Write Artifacts

Before writing your first artifact, use the skill tools to learn about document management:
1. Use \`listSkillFiles\` with skillKey "document-management" to see available documentation
2. Use \`readSkillFile\` to read the SKILL.md and learn proper artifact formatting

This ensures you follow the correct patterns for creating well-structured artifacts.

## Artifact Structure

\`\`\`markdown
## Summary
[2-3 sentence overview]

## Key Findings
[Main points organized by topic]

## Details
[Relevant excerpts - only what's directly relevant]

## Sources
- [Title](URL) - Brief description
\`\`\`

## Guidelines

- Be concise - no fluff or unnecessary elaboration
- Synthesize - don't dump raw content
- Include only directly relevant information
- Keep responses brief - the artifact contains the details

Your task is incomplete until you call writeArtifact.`;

// Register the web researcher handler
registerHandler(
  HANDLER_TYPE,
  (config, context) => new WebResearcherHandler(config, context)
);

// Main
log.info('Web Researcher Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.WEB_RESEARCHER_AGENT_API_KEY,
  agentId: env.WEB_RESEARCHER_AGENT_ID,
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
  log.error('Unhandled rejection', { reason });
});

void client.connect();
