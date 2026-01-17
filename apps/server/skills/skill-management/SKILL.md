---
name: skill-management
description: Create, update, and delete custom skills. List and view skill details. Use when creating new skills, updating skill documentation, organizing skill libraries, or learning skill best practices.
allowed-tools:
  - listSkills
  - getSkill
  - createSkill
  - updateSkill
  - deleteSkill
---

# Skill Management

Create, update, and manage custom skills that extend agent capabilities.

## Permission Scopes

| Tool        | Required Scope  |
| ----------- | --------------- |
| listSkills  | `skills:read`   |
| getSkill    | `skills:read`   |
| createSkill | `skills:write`  |
| updateSkill | `skills:write`  |
| deleteSkill | `skills:delete` |

See `references/validation-limits.md` for all constraints.

## Available Tools

### listSkills

List all skills available to the user with optional filtering.

**Parameters:**

- `--filter` (optional): `"all"` | `"system"` | `"user"` (default: `"all"`)
- `--search` (optional): Search skills by name, description, or key
- `--limit` (optional): 1-50 (default: 20)

**Examples:**

```
listSkills
listSkills --filter "user"
listSkills --filter "system" --search "web"
listSkills --limit 50
```

**Returns:** id, key, name, description, isSystem, fileCount, createdAt, updatedAt

### getSkill

Get detailed information about a specific skill including all files.

**Parameters:**

- `--skillId` (optional): UUID of the skill
- `--skillKey` (optional): Key of the skill (e.g., "web-research")

_Note: Either skillId OR skillKey must be provided._

**Examples:**

```
getSkill --skillKey "my-api"
getSkill --skillId "uuid-here"
```

**Returns:** Full skill with id, key, name, description, isSystem, files (path + content), timestamps

### createSkill

Create a new user skill with documentation files.

**Parameters:**

- `--key` (required): Unique identifier (1-64 chars, lowercase/numbers/hyphens)
- `--name` (required): Display name (1-255 chars)
- `--description` (required): Discovery description (1-1000 chars)
- `--files` (required): JSON array of {path, content} objects (1-20 files)

**File path rules:**

- Root files: `SKILL.md`, `config.json`
- References: `references/tips.md`, `references/examples.md`
- Assets: `assets/template.txt`, `assets/schema.json`
- Max path length: 255 chars
- Max content: 500KB per file

**Example:**

```
createSkill --key "my-api" --name "My API Docs" --description "API reference for My Service. Use when integrating with My API or asking about endpoints, authentication, or rate limits." --files '[{"path":"SKILL.md","content":"---\nname: my-api\ndescription: API reference for My Service.\nallowed-tools:\n  - fetch\n  - webSearch\n---\n\n# My API\n\n## Authentication\nUse Bearer tokens...\n\n## Endpoints\n- GET /users - List users\n- POST /orders - Create order"}]'
```

### updateSkill

Update an existing user skill.

**Parameters:**

- `--id` (required): UUID of the skill to update
- `--key` (optional): New skill key
- `--name` (optional): New display name
- `--description` (optional): New description
- `--files` (optional): New files array (full replacement, not merge)

**Examples:**

```
updateSkill --id "uuid" --description "Better description with trigger keywords"
updateSkill --id "uuid" --name "New Name"
updateSkill --id "uuid" --files '[{"path":"SKILL.md","content":"Updated content..."}]'
```

**Important:** The `--files` parameter replaces all existing files. Include all files you want to keep.

### deleteSkill

Delete a user skill permanently.

**Parameters:**

- `--id` (required): UUID of the skill to delete

**Example:**

```
deleteSkill --id "uuid-here"
```

**Warning:** Deletion is permanent and cannot be undone. System skills cannot be deleted.

## Common Workflows

### Create a skill for API documentation

```
listSkills --filter "user"
# Check existing skills

createSkill --key "acme-api" --name "ACME API" --description "ACME Corp API reference. Use when integrating with ACME services, authentication, or API endpoints." --files '[{"path":"SKILL.md","content":"---\nname: acme-api\ndescription: ACME API reference.\n---\n\n# ACME API\n\n## Base URL\nhttps://api.acme.com/v1\n\n## Authentication\nBearer token in Authorization header\n\n## Endpoints\n- GET /users - List users\n- POST /orders - Create order"}]'
```

### Update skill description for better discovery

```
getSkill --skillKey "my-skill"
# Note the skill ID

updateSkill --id "uuid" --description "Improved description with trigger keywords like API, integration, endpoints"
```

### Add reference files to an existing skill

```
getSkill --skillKey "my-skill"
# Copy existing files array, add new reference file

updateSkill --id "uuid" --files '[{"path":"SKILL.md","content":"...existing..."},{"path":"references/errors.md","content":"# Error Codes\n\n- 400: Bad Request\n- 401: Unauthorized"}]'
```

### Delete a skill no longer needed

```
listSkills --filter "user" --search "old"
# Find the skill ID

deleteSkill --id "uuid-here"
```

## Reference Documentation

- `references/skill-format.md` - SKILL.md format and YAML frontmatter
- `references/validation-limits.md` - All validation constraints
- `references/file-structure.md` - Directory layout and allowed paths
- `references/best-practices.md` - Writing effective descriptions
