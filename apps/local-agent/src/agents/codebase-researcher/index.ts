import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { CodebaseResearcherHandler } from './handler';

const log = createLogger('CodebaseResearcher');

// Handler type identifier
const HANDLER_TYPE = 'codebase-researcher';

// Codebase-specific tools (read-only file operations)
const ALLOWED_TOOLS = ['Read', 'Glob', 'Grep'];

// Register the codebase researcher handler
registerHandler(
  HANDLER_TYPE,
  (config) => new CodebaseResearcherHandler(config)
);

// Main
log.info('Codebase Researcher Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: env.WORKING_DIRECTORY ?? process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.AGENT_API_KEY,
  agentId: env.AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: env.WORKING_DIRECTORY ?? process.cwd(),
    allowedTools: ALLOWED_TOOLS,
    model: env.MODEL,
    maxThinkingTokens: env.MAX_THINKING_TOKENS,
    includePartialMessages: env.INCLUDE_PARTIAL_MESSAGES,
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
