-- Add tags column to artifacts table
ALTER TABLE "artifacts" ADD COLUMN "tags" jsonb NOT NULL DEFAULT '[]';

-- Create GIN index for efficient tag queries
CREATE INDEX IF NOT EXISTS "artifacts_tags_gin_idx" ON "artifacts" USING GIN ("tags");
