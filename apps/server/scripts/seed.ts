import { db } from '../src/db';
import { agents } from '../src/db/schema';

async function seed() {
  console.log('Seeding database...');

  // Seed default agents
  const defaultAgents = [
    {
      id: 'general-assistant',
      name: 'General Assistant',
      description: 'A helpful AI assistant for general tasks',
      systemPrompt: `You are a helpful AI assistant. Be concise, accurate, and helpful.

When using tools:
- Use the getTime tool when asked about the current date or time
- Explain what you're doing when using tools

Be friendly but professional.`,
      provider: 'openai',
      model: 'gpt-4o',
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
