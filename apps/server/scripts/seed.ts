import { seedSystemAgents, seedDemoData } from '../src/db/seed/index';

async function seed() {
  const args = process.argv.slice(2);
  const includeDemo = args.includes('--demo');

  console.log('Seeding database...');

  // Always seed system agents
  await seedSystemAgents();

  // Optionally seed demo data
  if (includeDemo) {
    await seedDemoData();
  }

  console.log('Seeding complete');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
