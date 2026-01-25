-- Create artifact_tags junction table with unique constraint
CREATE TABLE IF NOT EXISTS "artifact_tags" (
  "artifact_id" uuid NOT NULL REFERENCES "artifacts"("id") ON DELETE CASCADE,
  "tag" varchar(50) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("artifact_id", "tag")
);

-- Create index for efficient tag lookups
CREATE INDEX IF NOT EXISTS "artifact_tags_tag_idx" ON "artifact_tags" ("tag");

-- Migrate existing tags from JSONB column to new table
INSERT INTO "artifact_tags" ("artifact_id", "tag", "created_at")
SELECT
  a.id,
  tag.value::text,
  a.created_at
FROM "artifacts" a,
  jsonb_array_elements_text(a.tags) AS tag(value)
WHERE jsonb_array_length(a.tags) > 0
ON CONFLICT DO NOTHING;

-- Drop the old tags column and index
DROP INDEX IF EXISTS "artifacts_tags_gin_idx";
ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "tags";
