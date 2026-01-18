---
name: slash-command-management
description: Create and manage slash commands - reusable prompt templates that users can quickly insert in chat. Use when creating new commands, updating prompt templates, or organizing command libraries.
allowed-tools:
  - listSlashCommands
  - getSlashCommand
  - createSlashCommand
  - updateSlashCommand
  - deleteSlashCommand
---

# Slash Command Management

Create, update, and manage slash commands that provide reusable prompt templates.

## Permission Scopes

| Tool               | Required Scope         | Needs Approval |
| ------------------ | ---------------------- | -------------- |
| listSlashCommands  | `slashCommands:read`   | No             |
| getSlashCommand    | `slashCommands:read`   | No             |
| createSlashCommand | `slashCommands:write`  | Yes            |
| updateSlashCommand | `slashCommands:write`  | Yes            |
| deleteSlashCommand | `slashCommands:delete` | Yes            |

## Validation Rules

| Parameter     | Constraints                                                       |
| ------------- | ----------------------------------------------------------------- |
| `id`          | UUID format, auto-lowercased, whitespace trimmed                  |
| `key`         | 1-64 chars, regex: `/^[a-z0-9-]+$/` (lowercase, numbers, hyphens) |
| `name`        | 1-255 chars                                                       |
| `description` | 0-500 chars (empty string clears the description)                 |
| `prompt`      | 1-10000 chars                                                     |

## Available Tools

### listSlashCommands

List all slash commands for the user with pagination.

**Parameters:**

- `--limit` (optional): 1-100 (default: 50)
- `--cursor` (optional): UUID of last item for pagination
- `--search` (optional): Filter by key, name, or description

**Examples:**

```
listSlashCommands
listSlashCommands --limit 20
listSlashCommands --cursor "uuid-of-last-item"
listSlashCommands --search "review"
```

**Returns:** id, key, name, description, prompt, createdAt, updatedAt, nextCursor

### getSlashCommand

Get detailed information about a specific slash command.

**Parameters:**

- `--id` (required): UUID of the slash command

**Example:**

```
getSlashCommand --id "uuid-here"
```

**Returns:** Full command with id, key, name, description, prompt, timestamps

### createSlashCommand

Create a new slash command with a prompt template.

**Parameters:**

- `--key` (required): Unique identifier (1-64 chars, lowercase/numbers/hyphens)
- `--name` (required): Display name (1-255 chars)
- `--description` (optional): Brief description for autocomplete (max 500 chars)
- `--prompt` (required): The prompt template to insert (1-10000 chars)

**Key naming rules:**

- Lowercase letters, numbers, and hyphens only
- Max 64 characters
- Must be unique per user

**Example:**

```
createSlashCommand --key "code-review" --name "Code Review" --description "Review code for bugs and best practices" --prompt "Please review the following code for potential bugs, security issues, and best practices:\n\n[paste code here]\n\nProvide specific suggestions for improvement."
```

### updateSlashCommand

Update an existing slash command.

**Parameters:**

- `--id` (required): UUID of the command to update
- `--key` (optional): New command key
- `--name` (optional): New display name
- `--description` (optional): New description
- `--prompt` (optional): New prompt template

**Example:**

```
updateSlashCommand --id "uuid" --description "Better description"
updateSlashCommand --id "uuid" --prompt "Updated prompt template..."
```

**Notes:**

- At least one optional field (key, name, description, or prompt) must be provided
- Changing the key will change how users invoke the command

### deleteSlashCommand

Delete a slash command permanently.

**Parameters:**

- `--id` (required): UUID of the command to delete

**Example:**

```
deleteSlashCommand --id "uuid-here"
```

**Warning:** Deletion is permanent and cannot be undone.

## Common Workflows

### Create a code review command

```
listSlashCommands
# Check existing commands

createSlashCommand --key "review" --name "Code Review" --description "Comprehensive code review" --prompt "Please review this code for:\n- Bugs and logic errors\n- Security vulnerabilities\n- Performance issues\n- Code style and readability\n\nCode:\n"
```

### Create a summarization command

```
createSlashCommand --key "summarize" --name "Summarize" --description "Summarize text or documents" --prompt "Please provide a concise summary of the following content, highlighting the key points and main takeaways:\n\n"
```

### Update a command's prompt

```
listSlashCommands
# Find the command ID

getSlashCommand --id "uuid"
# Review current prompt

updateSlashCommand --id "uuid" --prompt "New improved prompt template..."
```

### Delete an unused command

```
listSlashCommands
# Find the command to delete

deleteSlashCommand --id "uuid-here"
```

## Best Practices

1. **Use descriptive keys**: Choose keys that clearly indicate the command's purpose (e.g., "code-review", "summarize-doc", "explain-error")

2. **Write clear descriptions**: Descriptions appear in autocomplete, so make them helpful and concise

3. **Design reusable prompts**: Write prompts that work with various inputs, using placeholders or clear instructions for where users should add context

4. **Include formatting**: Use newlines and structure in prompts to make them easy to read and use

5. **Keep prompts focused**: Each command should do one thing well rather than trying to handle multiple use cases

## Response Structures

### Success Response (get/create/update)

```json
{
  "success": true,
  "command": {
    "id": "uuid",
    "key": "command-key",
    "name": "Command Name",
    "description": "Description or null",
    "prompt": "Prompt template",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  },
  "message": "Slash command \"/command-key\" created/updated successfully."
}
```

### Success Response (delete)

```json
{
  "success": true,
  "deletedCommand": {
    "id": "uuid",
    "key": "command-key",
    "name": "Command Name"
  },
  "message": "Slash command \"/command-key\" has been permanently deleted."
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Error Messages

| Condition          | Error Message                                                                       |
| ------------------ | ----------------------------------------------------------------------------------- |
| Command not found  | `Slash command with ID ${id} not found`                                             |
| Duplicate key      | `A slash command with key "${key}" already exists. Choose a different key.`         |
| No update fields   | `At least one field (key, name, description, or prompt) must be provided to update` |
| Invalid key format | `Key must be lowercase alphanumeric with hyphens only`                              |

## Behavior Notes

- **User/Org isolation**: Commands are only accessible by the user/org that created them
- **Automatic timestamps**: `updatedAt` is automatically updated on any modification
- **Cache invalidation**: Updates publish a `slashCommandUpdated` event for real-time sync
