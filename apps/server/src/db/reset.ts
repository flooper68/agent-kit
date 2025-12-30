import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { runMigrations } from './migrate';

async function reset() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('Dropping all tables...');

  // Drop all tables in public schema
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop drizzle migrations table
  await db.execute(
    sql`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`
  );
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

  console.log('All tables dropped');

  await client.end();

  // Run migrations
  await runMigrations();

  console.log('Database reset complete');
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  });
