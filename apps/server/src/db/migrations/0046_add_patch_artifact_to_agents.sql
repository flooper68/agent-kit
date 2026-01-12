-- Add patchArtifact tool to all agents that have updateArtifact
-- This adds the new patchArtifact tool right after updateArtifact in the tools array

-- Update server_agents: add patchArtifact after updateArtifact
UPDATE "server_agents"
SET "tools" = (
  SELECT jsonb_agg(elem ORDER BY ord)
  FROM (
    SELECT elem, row_number() OVER () * 2 - 1 AS ord
    FROM jsonb_array_elements("tools") AS elem
    UNION ALL
    SELECT '"patchArtifact"'::jsonb AS elem,
           (row_number() OVER ()) * 2 AS ord
    FROM jsonb_array_elements("tools") AS e
    WHERE e::text = '"updateArtifact"'
  ) sub
),
"updated_at" = NOW()
WHERE "tools"::text LIKE '%updateArtifact%'
  AND "tools"::text NOT LIKE '%patchArtifact%';
--> statement-breakpoint

-- Update external_agents: add patchArtifact after updateArtifact
UPDATE "external_agents"
SET "tools" = (
  SELECT jsonb_agg(elem ORDER BY ord)
  FROM (
    SELECT elem, row_number() OVER () * 2 - 1 AS ord
    FROM jsonb_array_elements("tools") AS elem
    UNION ALL
    SELECT '"patchArtifact"'::jsonb AS elem,
           (row_number() OVER ()) * 2 AS ord
    FROM jsonb_array_elements("tools") AS e
    WHERE e::text = '"updateArtifact"'
  ) sub
),
"updated_at" = NOW()
WHERE "tools"::text LIKE '%updateArtifact%'
  AND "tools"::text NOT LIKE '%patchArtifact%';
