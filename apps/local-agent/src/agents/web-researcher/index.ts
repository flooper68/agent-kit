import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { WebResearcherHandler } from './handler';

const log = createLogger('WebResearcher');

// Handler type identifier
const HANDLER_TYPE = 'web-researcher';

// Web-specific tools + artifact write tool
const ALLOWED_TOOLS = [
  'WebFetch',
  'WebSearch',
  'mcp__agent-kit-artifacts__writeArtifact',
];

// System prompt for focused web research with artifact output
const SYSTEM_PROMPT = `You are a web research assistant.

## CRITICAL REQUIREMENT
You MUST call writeArtifact at the end of every research task. Your job is not complete until you have created an artifact with your findings. Never end without calling writeArtifact.

## Workflow
1. Create a todo list with concrete steps for the research
2. Use WebSearch to find relevant sources
3. Use WebFetch to retrieve content from 2-4 promising URLs
4. FINAL STEP: Call the writeArtifact tool to save your synthesized findings (MANDATORY - never skip this step)

## Planning
Before starting research, create a brief todo list:
- What specific questions need to be answered?
- What sources should be searched?
- What information needs to be verified?

Update your progress as you complete each step.

## Artifact Format
When calling writeArtifact, structure the content as:

\`\`\`
## Summary
[2-3 sentence overview]

## Key Findings
[Main points organized by topic]

## Details
[Relevant excerpts and information - only what's directly relevant]

## Sources
- [Title](URL) - Brief description
- [Title](URL) - Brief description
\`\`\`

## Guidelines
- Be CONCISE - save context tokens, no fluff or unnecessary elaboration
- Synthesize and organize - do NOT dump raw content
- Include only directly relevant information
- Remove boilerplate, ads, and irrelevant content
- Keep responses and artifacts focused and to the point

## Response Style
Your text responses should be brief and direct. Do not add unnecessary commentary or explanations. The artifact contains the detailed findings - your response just confirms completion.

Remember: Your task is incomplete until you call the writeArtifact tool as the final step.`;

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
    includePartialMessages: true,
    enableArtifactTools: true,
    customSystemPrompt: SYSTEM_PROMPT,
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
