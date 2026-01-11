import { sql } from 'drizzle-orm';
import { env } from '../env';
import { db } from './index';
import { seedSystemAgents, seedDemoData, isDemoDataSeeded } from './seed/index';

// Advisory lock ID for PR environment seeding (arbitrary unique number)
const SEED_LOCK_ID = 12345;

/**
 * Automatically seeds PR environments with demo data.
 * Called on server startup after migrations.
 *
 * PR environments are detected via RAILWAY_ENVIRONMENT_NAME which follows
 * the pattern "agent-kit-pr-{number}" for PR deployments.
 *
 * Uses PostgreSQL advisory lock to prevent race conditions when multiple
 * instances start simultaneously.
 */
export async function seedPREnvironment(): Promise<void> {
  const envName = env.RAILWAY_ENVIRONMENT_NAME;

  // Skip if not in a Railway environment
  if (!envName) {
    return;
  }

  // Check if this is a PR environment (matches pattern like "agent-kit-pr-57")
  const isPREnvironment = envName.includes('-pr-');

  if (!isPREnvironment) {
    console.log(
      `Railway environment "${envName}" is not a PR environment, skipping demo seed`
    );
    return;
  }

  console.log(`PR environment detected: ${envName}`);

  // Try to acquire advisory lock (non-blocking)
  // If another instance is already seeding, we skip
  const lockResult = await db.execute<{ acquired: boolean }>(
    sql`SELECT pg_try_advisory_lock(${SEED_LOCK_ID}) as acquired`
  );
  const acquired = lockResult[0]?.acquired;

  if (!acquired) {
    console.log('Another instance is seeding, skipping...');
    return;
  }

  try {
    // Always ensure system agents exist
    console.log('Ensuring system agents are seeded...');
    await seedSystemAgents();

    // Check if demo data already seeded (idempotent check)
    const alreadySeeded = await isDemoDataSeeded();

    if (alreadySeeded) {
      console.log('Demo data already seeded, skipping');
      return;
    }

    // Seed demo data for PR environment
    console.log('Seeding demo data for PR environment...');
    await seedDemoData();
    console.log('PR environment seeding complete');
  } finally {
    // Release the advisory lock
    await db.execute(sql`SELECT pg_advisory_unlock(${SEED_LOCK_ID})`);
  }
}
