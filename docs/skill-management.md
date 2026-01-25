# Skill Management

This document describes the agent actions for managing skills programmatically. These tools allow agents to list, read, create, update, and delete user skills.

## Overview

Skills can be managed through five agent actions:

| Action        | Permission    | Description                    |
| ------------- | ------------- | ------------------------------ |
| `listSkills`  | SKILLS_READ   | List all available skills      |
| `getSkill`    | SKILLS_READ   | Get skill details by ID or key |
| `createSkill` | SKILLS_WRITE  | Create a new user skill        |
| `updateSkill` | SKILLS_WRITE  | Update an existing user skill  |
| `deleteSkill` | SKILLS_DELETE | Delete a user skill            |

> **Note**: System skills are read-only. Only user-created skills can be modified or deleted.

## Actions

### listSkills

List all skills available to the user. Use this to discover available skills before using them.

**Parameters:**

| Parameter | Type   | Required | Default | Description                                            |
| --------- | ------ | -------- | ------- | ------------------------------------------------------ |
| `filter`  | enum   | No       | `"all"` | Filter by skill type: `"system"`, `"user"`, or `"all"` |
| `search`  | string | No       | -       | Search skills by name, description, or key             |
| `limit`   | number | No       | 20      | Maximum number of skills to return (1-50)              |

**Returns:**

```typescript
{
  skills: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    isSystem: boolean;
    fileCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  hasMore: boolean;
}
```

**Example:**

```
listSkills --filter "user"
listSkills --search "web" --limit 10
```

### getSkill

Get detailed information about a specific skill including all file contents.

**Parameters:**

| Parameter  | Type          | Required                   | Description                                 |
| ---------- | ------------- | -------------------------- | ------------------------------------------- |
| `skillId`  | string (UUID) | Either skillId or skillKey | The unique ID of the skill                  |
| `skillKey` | string        | Either skillId or skillKey | The key of the skill (e.g., "web-research") |

**Returns:**

```typescript
{
  success: boolean;
  skill?: {
    id: string;
    key: string;
    name: string;
    description: string;
    isSystem: boolean;
    files: Array<{
      path: string;
      content: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}
```

**Example:**

```
getSkill --skillKey "web-research"
getSkill --skillId "550e8400-e29b-41d4-a716-446655440000"
```

### createSkill

Create a new user skill with documentation files.

**Parameters:**

| Parameter     | Type   | Required | Description                                                        |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `key`         | string | Yes      | Unique identifier (lowercase, numbers, hyphens only, max 64 chars) |
| `name`        | string | Yes      | Display name for the skill (max 255 chars)                         |
| `description` | string | Yes      | Short description for skill discovery (max 1000 chars)             |
| `files`       | array  | Yes      | Documentation files (1-20 files)                                   |

**File Object:**

| Field           | Type   | Required                        | Description                               |
| --------------- | ------ | ------------------------------- | ----------------------------------------- |
| `path`          | string | Yes                             | File path within skill (e.g., "SKILL.md") |
| `content`       | string | Either content or contentBase64 | File content (max 500KB)                  |
| `contentBase64` | string | Either content or contentBase64 | Base64-encoded content                    |

**Returns:**

```typescript
{
  success: boolean;
  skill?: {
    id: string;
    key: string;
    name: string;
    description: string;
    fileCount: number;
  };
  message?: string;
  error?: string;
}
```

**Example:**

```
createSkill --key "my-custom-skill" --name "My Custom Skill" --description "A custom skill for specific tasks" --files '[{"path": "SKILL.md", "content": "# My Skill\n\nInstructions here..."}]'
```

### updateSkill

Update an existing user skill. System skills cannot be modified.

**Parameters:**

| Parameter     | Type          | Required              | Description                                           |
| ------------- | ------------- | --------------------- | ----------------------------------------------------- |
| `id`          | string (UUID) | Either id or skillKey | The ID of the skill to update                         |
| `skillKey`    | string        | Either id or skillKey | The key of the skill to update                        |
| `key`         | string        | No                    | New skill key                                         |
| `name`        | string        | No                    | New display name                                      |
| `description` | string        | No                    | New description                                       |
| `files`       | array         | No                    | New documentation files (replaces all existing files) |

**Returns:**

```typescript
{
  success: boolean;
  skill?: {
    id: string;
    key: string;
    name: string;
    description: string;
    fileCount: number;
  };
  message?: string;
  error?: string;
}
```

**Example:**

```
updateSkill --skillKey "my-custom-skill" --name "Updated Skill Name"
updateSkill --id "550e8400-e29b-41d4-a716-446655440000" --files '[{"path": "SKILL.md", "content": "# Updated Content"}]'
```

### deleteSkill

Delete a user skill permanently. System skills cannot be deleted.

**Parameters:**

| Parameter  | Type          | Required              | Description                    |
| ---------- | ------------- | --------------------- | ------------------------------ |
| `id`       | string (UUID) | Either id or skillKey | The ID of the skill to delete  |
| `skillKey` | string        | Either id or skillKey | The key of the skill to delete |

**Returns:**

```typescript
{
  success: boolean;
  deletedSkill?: {
    id: string;
    key: string;
    name: string;
  };
  message?: string;
  error?: string;
}
```

**Example:**

```
deleteSkill --skillKey "my-custom-skill"
deleteSkill --id "550e8400-e29b-41d4-a716-446655440000"
```

## Permissions

Skills management requires specific agent scopes:

| Scope           | Actions                  |
| --------------- | ------------------------ |
| `SKILLS_READ`   | listSkills, getSkill     |
| `SKILLS_WRITE`  | createSkill, updateSkill |
| `SKILLS_DELETE` | deleteSkill              |

Write and delete actions require user approval before execution.

## Skill File Structure

Skills follow a virtual file system structure:

```
skill-key/
├── SKILL.md              # Main instructions (required)
└── references/           # Additional documentation
    ├── tips.md
    └── examples.md
```

### File Path Rules

- Paths are relative to the skill root
- Use forward slashes for path separators
- Common patterns: `SKILL.md`, `references/file.md`, `examples/example1.md`
- Maximum 20 files per skill
- Maximum 500KB per file

## System vs User Skills

| Feature         | System Skills           | User Skills      |
| --------------- | ----------------------- | ---------------- |
| Source          | Built into the platform | Created by users |
| Modifiable      | No                      | Yes              |
| Deletable       | No                      | Yes              |
| `isSystem` flag | `true`                  | `false`          |

System skills provide core functionality (web-research, project-management, etc.) and cannot be modified. User skills allow customization for specific workflows.

## Best Practices

1. **Use descriptive keys**: Choose keys that clearly identify the skill (e.g., "code-review", "api-testing")

2. **Write comprehensive SKILL.md**: Include usage examples, common workflows, and best practices

3. **Organize with references**: Put detailed documentation in `references/` subdirectory

4. **Keep files focused**: Each file should cover one topic clearly

5. **Test before creating**: Validate your skill content works as expected

6. **Update incrementally**: When updating files, include all files (the update replaces all existing files)
