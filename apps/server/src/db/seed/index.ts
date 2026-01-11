import { db } from '../index';
import { serverAgents, projects } from '../schema';
import { eq } from 'drizzle-orm';
import { seedDemoData, DEMO_PROJECT_ID } from './demo-data';

const STANDARD_SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use getTime when asked about the current date or time
- Use webSearch to find current information from the web
- Use extractContent to get full article text from URLs
- Explain what you're doing when using tools

Be friendly but professional.`;

/**
 * Seeds system agents (default LLM assistants available to all users)
 * These have no userId and are available globally
 */
export async function seedSystemAgents() {
  console.log('Seeding system agents...');

  const defaultAgents = [
    // November 2025
    {
      userId: '',
      key: 'assistant-gpt-5.2',
      name: 'Assistant - GPT-5.2',
      description: 'Most capable OpenAI model with advanced reasoning',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5.2',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gpt-5.2-codex',
      name: 'Assistant - GPT-5.2 Codex',
      description: 'Specialized for code generation and analysis',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5.2-codex',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-opus-4.5',
      name: 'Assistant - Opus 4.5',
      description: 'Most capable Anthropic model for complex tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // October 2025
    {
      userId: '',
      key: 'assistant-gemini-3-pro',
      name: 'Assistant - Gemini 3 Pro',
      description: 'Most capable Google model for complex reasoning',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-3-pro-preview',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gemini-3-flash',
      name: 'Assistant - Gemini 3 Flash',
      description: 'Fast and efficient Google assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-haiku-4.5',
      name: 'Assistant - Haiku 4.5',
      description: 'Fast and efficient for quick tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // September 2025
    {
      userId: '',
      key: 'assistant-sonnet-4.5',
      name: 'Assistant - Sonnet 4.5',
      description: 'Balanced performance and intelligence',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gpt-5',
      name: 'Assistant - GPT-5',
      description: 'Powerful OpenAI model for complex tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gpt-5-mini',
      name: 'Assistant - GPT-5 Mini',
      description: 'Balanced performance and cost efficiency',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5-mini',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gpt-5-nano',
      name: 'Assistant - GPT-5 Nano',
      description: 'Ultra-fast and cost-effective for simple tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5-nano',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // August 2025
    {
      userId: '',
      key: 'assistant-opus-4.1',
      name: 'Assistant - Opus 4.1',
      description: 'Premium Anthropic model for demanding tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-opus-4-1-20250805',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // June 2025
    {
      userId: '',
      key: 'assistant-gemini-2.5-pro',
      name: 'Assistant - Gemini 2.5 Pro',
      description: 'Powerful model for advanced tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gemini-2.5-flash',
      name: 'Assistant - Gemini 2.5 Flash',
      description: 'Quick responses for everyday use',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-gemini-2.5-flash-lite',
      name: 'Assistant - Gemini 2.5 Flash-Lite',
      description: 'Ultra-lightweight and cost-effective',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-flash-lite',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // May 2025
    {
      userId: '',
      key: 'assistant-sonnet-4',
      name: 'Assistant - Sonnet 4',
      description: 'Reliable performance for everyday tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // April 2025
    {
      userId: '',
      key: 'assistant-o3',
      name: 'Assistant - o3',
      description: 'OpenAI reasoning model for complex problem solving',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'o3',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    {
      userId: '',
      key: 'assistant-o4-mini',
      name: 'Assistant - o4-mini',
      description: 'Compact reasoning model for efficient analysis',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'o4-mini',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // December 2024
    {
      userId: '',
      key: 'assistant-gemini-2.0-flash',
      name: 'Assistant - Gemini 2.0 Flash',
      description: 'Fast legacy model for simple tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // October 2024
    {
      userId: '',
      key: 'assistant-haiku-3.5',
      name: 'Assistant - Haiku 3.5',
      description: 'Quick and affordable assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // July 2024
    {
      userId: '',
      key: 'assistant-gpt-4o-mini',
      name: 'Assistant - GPT-4o Mini',
      description: 'Fast and affordable multimodal assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-4o-mini',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
    // May 2024
    {
      userId: '',
      key: 'assistant-gpt-4o',
      name: 'Assistant - GPT-4o',
      description: 'Multimodal model with vision capabilities',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-4o',
      tools: ['getTime', 'webSearch', 'extractContent'],
      scopes: ['artifacts:read', 'artifacts:write'],
    },
  ];

  const seedAgents = await db
    .insert(serverAgents)
    .values(defaultAgents)
    .onConflictDoNothing()
    .returning();

  console.log(`Seeded ${seedAgents.length} system agents`);
  return seedAgents;
}

/**
 * Check if demo data has already been seeded
 * Uses the existence of the demo project as an indicator
 */
export async function isDemoDataSeeded(): Promise<boolean> {
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, DEMO_PROJECT_ID),
  });
  return !!existing;
}

// Re-export demo seeding function
export { seedDemoData };
