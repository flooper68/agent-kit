-- Unique constraint for user skills (non-system skills have user_id)
CREATE UNIQUE INDEX IF NOT EXISTS "skills_user_org_key_unique"
ON "skills" ("user_id", "org_id", "key")
WHERE "is_system" = false;

-- Unique constraint for system skills (key must be globally unique)
CREATE UNIQUE INDEX IF NOT EXISTS "skills_system_key_unique"
ON "skills" ("key")
WHERE "is_system" = true;
