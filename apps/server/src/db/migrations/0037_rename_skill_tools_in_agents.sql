-- Rename skill tool references in agent tables
-- grepSkills -> listSkillFiles
-- executeSkill -> executeCommand

-- Update server_agents.tools JSONB array
UPDATE "server_agents"
SET "tools" = (
  SELECT jsonb_agg(
    CASE
      WHEN elem::text = '"grepSkills"' THEN '"listSkillFiles"'::jsonb
      WHEN elem::text = '"executeSkill"' THEN '"executeCommand"'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements("tools") elem
),
    "updated_at" = NOW()
WHERE "tools" @> '["grepSkills"]'::jsonb
   OR "tools" @> '["executeSkill"]'::jsonb;

-- Update external_agents.allowed_tools JSONB array
UPDATE "external_agents"
SET "allowed_tools" = (
  SELECT jsonb_agg(
    CASE
      WHEN elem::text = '"grepSkills"' THEN '"listSkillFiles"'::jsonb
      WHEN elem::text = '"executeSkill"' THEN '"executeCommand"'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements("allowed_tools") elem
),
    "updated_at" = NOW()
WHERE "allowed_tools" @> '["grepSkills"]'::jsonb
   OR "allowed_tools" @> '["executeSkill"]'::jsonb;
