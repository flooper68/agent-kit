import { env } from '../env';
import { seedSystemAgents, seedDemoData, isDemoDataSeeded } from './seed/index';

/**
 * Automatically seeds PR environments with demo data.
 * Called on server startup after migrations.
 *
 * PR environments are detected via RAILWAY_ENVIRONMENT_NAME which follows
 * the pattern "agent-kit-pr-{number}" for PR deployments.
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
}
