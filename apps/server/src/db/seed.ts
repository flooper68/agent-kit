import { db } from './index';
import { sessions } from './schema';

async function seed() {
  console.log('Seeding database...');

  // Create some sample sessions
  const seedSessions = await db
    .insert(sessions)
    .values([{}, {}, {}])
    .returning();

  console.log(`Created ${seedSessions.length} sessions:`);
  for (const session of seedSessions) {
    console.log(
      `  - ${session.id} (created: ${session.createdAt.toISOString()})`
    );
  }

  console.log('Seeding complete');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
