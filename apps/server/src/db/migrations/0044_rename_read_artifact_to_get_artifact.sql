-- Rename readArtifact to getArtifact
-- 1. Update document-management skill with new tool name and startLine/limit docs
-- 2. Update all agents (server and external) to use getArtifact instead of readArtifact

-- Update document-management skill
UPDATE "skills"
SET "files" = '[
  {
    "path": "SKILL.md",
    "content": "# Document Management Skill\n\nManage documents (artifacts) - create, read, update, and search.\n\n## Available Tools\n\n- **writeArtifact**: Create a new document\n- **getArtifact**: Read an existing document by ID (supports partial reads)\n- **searchArtifacts**: Search documents by title/content\n- **updateArtifact**: Update an existing document\n\n## Common Operations\n\n### Create a Document\n```\nwriteArtifact --title \"Meeting Notes\" --content \"# Meeting Notes\\n\\n...\" --summary \"Notes from team sync\"\n```\n\n### Search Documents\n```\nsearchArtifacts --query \"meeting notes\"\n```\n\n### Read a Document\n```\ngetArtifact --artifactId \"uuid-here\"\n```\n\n### Read First 50 Lines (like head)\n```\ngetArtifact --artifactId \"uuid-here\" --limit 50\n```\n\n### Read Lines 100-150 (pagination)\n```\ngetArtifact --artifactId \"uuid-here\" --startLine 100 --limit 50\n```\n\n### Update a Document\n```\nupdateArtifact --artifactId \"uuid-here\" --content \"Updated content...\"\n```\n\n## Best Practices\n\n- Use descriptive titles for easy searching\n- Include a summary for quick reference\n- Use markdown formatting for structure\n- Search before creating to avoid duplicates\n- Use startLine/limit for large documents to reduce response size\n"
  }
]'::jsonb,
"updated_at" = NOW()
WHERE "key" = 'document-management' AND "is_system" = true;
--> statement-breakpoint

-- Update server_agents tools array: replace readArtifact with getArtifact
UPDATE "server_agents"
SET "tools" = (
  SELECT jsonb_agg(
    CASE WHEN elem::text = '"readArtifact"' THEN '"getArtifact"'::jsonb
    ELSE elem
    END
  )
  FROM jsonb_array_elements("tools") AS elem
),
"updated_at" = NOW()
WHERE "tools"::text LIKE '%readArtifact%';
--> statement-breakpoint

-- Update external_agents allowed_tools array: replace readArtifact with getArtifact
UPDATE "external_agents"
SET "allowed_tools" = (
  SELECT jsonb_agg(
    CASE WHEN elem::text = '"readArtifact"' THEN '"getArtifact"'::jsonb
    ELSE elem
    END
  )
  FROM jsonb_array_elements("allowed_tools") AS elem
),
"updated_at" = NOW()
WHERE "allowed_tools"::text LIKE '%readArtifact%';
