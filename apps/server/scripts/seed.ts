import { db } from '../src/db';
import { agents } from '../src/db/schema';

const STANDARD_SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you're doing when using tools

Be friendly but professional.`;

async function seed() {
  console.log('Seeding database...');

  // Seed all agents - ordered by release date, newest first
  const defaultAgents = [
    // November 2025
    {
      id: 'assistant-gpt-5.2',
      name: 'Assistant - GPT-5.2',
      description: 'Most capable OpenAI model with advanced reasoning',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5.2',
      tools: ['getTime'],
      releasedAt: new Date('2025-11-15'),
    },
    {
      id: 'assistant-gpt-5.2-codex',
      name: 'Assistant - GPT-5.2 Codex',
      description: 'Specialized for code generation and analysis',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5.2-codex',
      tools: ['getTime'],
      releasedAt: new Date('2025-11-15'),
    },
    {
      id: 'assistant-opus-4.5',
      name: 'Assistant - Opus 4.5',
      description: 'Most capable Anthropic model for complex tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
      tools: ['getTime'],
      releasedAt: new Date('2025-11-01'),
    },
    // October 2025
    {
      id: 'assistant-gemini-3-pro',
      name: 'Assistant - Gemini 3 Pro',
      description: 'Most capable Google model for complex reasoning',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-3-pro-preview',
      tools: ['getTime'],
      releasedAt: new Date('2025-10-20'),
    },
    {
      id: 'assistant-gemini-3-flash',
      name: 'Assistant - Gemini 3 Flash',
      description: 'Fast and efficient Google assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
      tools: ['getTime'],
      releasedAt: new Date('2025-10-20'),
    },
    {
      id: 'assistant-haiku-4.5',
      name: 'Assistant - Haiku 4.5',
      description: 'Fast and efficient for quick tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      tools: ['getTime'],
      releasedAt: new Date('2025-10-01'),
    },
    // September 2025
    {
      id: 'assistant-sonnet-4.5',
      name: 'Assistant - Sonnet 4.5',
      description: 'Balanced performance and intelligence',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['getTime'],
      releasedAt: new Date('2025-09-29'),
    },
    {
      id: 'assistant-gpt-5',
      name: 'Assistant - GPT-5',
      description: 'Powerful OpenAI model for complex tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5',
      tools: ['getTime'],
      releasedAt: new Date('2025-09-15'),
    },
    {
      id: 'assistant-gpt-5-mini',
      name: 'Assistant - GPT-5 Mini',
      description: 'Balanced performance and cost efficiency',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5-mini',
      tools: ['getTime'],
      releasedAt: new Date('2025-09-15'),
    },
    {
      id: 'assistant-gpt-5-nano',
      name: 'Assistant - GPT-5 Nano',
      description: 'Ultra-fast and cost-effective for simple tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-5-nano',
      tools: ['getTime'],
      releasedAt: new Date('2025-09-15'),
    },
    // August 2025
    {
      id: 'assistant-opus-4.1',
      name: 'Assistant - Opus 4.1',
      description: 'Premium Anthropic model for demanding tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-opus-4-1-20250805',
      tools: ['getTime'],
      releasedAt: new Date('2025-08-05'),
    },
    // June 2025
    {
      id: 'assistant-gemini-2.5-pro',
      name: 'Assistant - Gemini 2.5 Pro',
      description: 'Powerful model for advanced tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      tools: ['getTime'],
      releasedAt: new Date('2025-06-15'),
    },
    {
      id: 'assistant-gemini-2.5-flash',
      name: 'Assistant - Gemini 2.5 Flash',
      description: 'Quick responses for everyday use',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      tools: ['getTime'],
      releasedAt: new Date('2025-06-15'),
    },
    {
      id: 'assistant-gemini-2.5-flash-lite',
      name: 'Assistant - Gemini 2.5 Flash-Lite',
      description: 'Ultra-lightweight and cost-effective',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.5-flash-lite',
      tools: ['getTime'],
      releasedAt: new Date('2025-06-15'),
    },
    // May 2025
    {
      id: 'assistant-sonnet-4',
      name: 'Assistant - Sonnet 4',
      description: 'Reliable performance for everyday tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      tools: ['getTime'],
      releasedAt: new Date('2025-05-14'),
    },
    // April 2025
    {
      id: 'assistant-o3',
      name: 'Assistant - o3',
      description: 'OpenAI reasoning model for complex problem solving',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'o3',
      tools: ['getTime'],
      releasedAt: new Date('2025-04-16'),
    },
    {
      id: 'assistant-o4-mini',
      name: 'Assistant - o4-mini',
      description: 'Compact reasoning model for efficient analysis',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'o4-mini',
      tools: ['getTime'],
      releasedAt: new Date('2025-04-16'),
    },
    // December 2024
    {
      id: 'assistant-gemini-2.0-flash',
      name: 'Assistant - Gemini 2.0 Flash',
      description: 'Fast legacy model for simple tasks',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      tools: ['getTime'],
      releasedAt: new Date('2024-12-10'),
    },
    // October 2024
    {
      id: 'assistant-haiku-3.5',
      name: 'Assistant - Haiku 3.5',
      description: 'Quick and affordable assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      tools: ['getTime'],
      releasedAt: new Date('2024-10-22'),
    },
    // July 2024
    {
      id: 'assistant-gpt-4o-mini',
      name: 'Assistant - GPT-4o Mini',
      description: 'Fast and affordable multimodal assistant',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-4o-mini',
      tools: ['getTime'],
      releasedAt: new Date('2024-07-18'),
    },
    // May 2024
    {
      id: 'assistant-gpt-4o',
      name: 'Assistant - GPT-4o',
      description: 'Multimodal model with vision capabilities',
      systemPrompt: STANDARD_SYSTEM_PROMPT,
      provider: 'openai',
      model: 'gpt-4o',
      tools: ['getTime'],
      releasedAt: new Date('2024-05-13'),
    },
  ];

  const seedAgents = await db
    .insert(agents)
    .values(defaultAgents)
    .onConflictDoNothing()
    .returning();

  console.log(`Seeded ${seedAgents.length} agents:`);
  for (const agent of seedAgents) {
    console.log(`  - ${agent.id}: ${agent.name}`);
  }

  console.log('Seeding complete');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
