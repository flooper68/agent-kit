-- Add secret_key_prefix column (nullable first for backfill)
ALTER TABLE "local_agents" ADD COLUMN "secret_key_prefix" varchar(32);

-- Backfill existing rows with prefix from current secret_key
-- (existing keys are plaintext, new keys will be hashed)
UPDATE "local_agents" SET "secret_key_prefix" = LEFT("secret_key", 20) || '...';

-- Make column NOT NULL after backfill
ALTER TABLE "local_agents" ALTER COLUMN "secret_key_prefix" SET NOT NULL;
