import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env, parseToolsList } from './env';
import { ClaudeCliHandler, type ClaudeCliHandlerConfig } from './handler';

const log = createLogger('ClaudeCli');

// Handler type identifier
const HANDLER_TYPE = 'claude-cli';

// Register the claude-cli handler
// Type assertion is safe because env.PERMISSION_MODE is required by Zod schema
registerHandler(
  HANDLER_TYPE,
  (config) => new ClaudeCliHandler(config as ClaudeCliHandlerConfig)
);

// Main
log.info('Claude CLI Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: env.WORKING_DIRECTORY ?? process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
  model: env.MODEL ?? 'default',
  permissionMode: env.PERMISSION_MODE,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.AGENT_API_KEY,
  agentId: env.AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: env.WORKING_DIRECTORY ?? process.cwd(),
    allowedTools: parseToolsList(env.ALLOWED_TOOLS) ?? [],
    model: env.MODEL,
    maxThinkingTokens: env.MAX_THINKING_TOKENS,
    maxTokens: env.MAX_TOKENS,
    disallowedTools: parseToolsList(env.DISALLOWED_TOOLS),
    appendSystemPrompt: env.APPEND_SYSTEM_PROMPT,
    permissionMode: env.PERMISSION_MODE,
  },
});

// Handle graceful shutdown
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

// Handle uncaught errors
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

// Connect to server
void client.connect();
