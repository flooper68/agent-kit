import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { WebResearcherHandler } from './handler';

const log = createLogger('WebResearcher');

// Handler type identifier
const HANDLER_TYPE = 'web-researcher';

// Web-specific tools
const ALLOWED_TOOLS = ['WebFetch', 'WebSearch'];

// Register the web researcher handler
registerHandler(HANDLER_TYPE, (config) => new WebResearcherHandler(config));

// Main
log.info('Web Researcher Agent starting', {
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
