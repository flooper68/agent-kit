import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { MockAgentHandler } from './handler';

const log = createLogger('MockAgent');

// Handler type identifier
const HANDLER_TYPE = 'mock-agent';

// Mock tools (these are simulated, not real tools)
const ALLOWED_TOOLS = ['MockRead', 'MockSearch', 'MockGrep'];

// Register the mock handler
registerHandler(HANDLER_TYPE, (config) => new MockAgentHandler(config));

// Main
log.info('Mock Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
  mockDelayMs: env.MOCK_DELAY_MS,
  mockThinkingEnabled: env.MOCK_THINKING_ENABLED,
  mockToolCalls: env.MOCK_TOOL_CALLS,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.AGENT_API_KEY,
  agentId: env.AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: process.cwd(),
    allowedTools: ALLOWED_TOOLS,
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
