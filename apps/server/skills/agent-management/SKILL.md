---
name: agent-management
description: Manage agents and understand the platform. List, configure, spawn agents. Reference for all tools, permission scopes, system skills, custom skill creation, and prompt writing best practices.
allowed-tools:
  - listAgents
  - getAgent
  - updateAgent
  - setAgentEnabled
  - toggleAgentFavorite
  - spawnAgent
---

# Agent Management

Manage agents and understand the platform capabilities.

## Agent Types

Two types of agents exist:
- **Server agents** - LLM-based, fully configurable (provider, model, tools, thinking)
- **External agents** - WebSocket-based, connect from external processes

See `references/agent-types.md` for details.

## Permission Scopes

| Tool | Required Scope |
|------|----------------|
| listAgents | `agents:read` |
| getAgent | `agents:read` |
| updateAgent | `agents:manage` |
| setAgentEnabled | `agents:manage` |
| toggleAgentFavorite | `agents:manage` |

See `references/permission-scopes.md` for all 20 scopes.

## Available Tools

### listAgents
List all available agents with optional filtering.

**Parameters:**
- `--type` (optional): `"server"` | `"external"` | `"all"` (default: `"all"`)
- `--includeDisabled` (optional): `true` | `false` (default: `false`)

**Examples:**
```
listAgents
listAgents --type "server"
listAgents --type "external" --includeDisabled true
```

**Returns:** id, key, name, description, type, disabled, isFavorite, createdAt, provider (server only), model (server only)

### getAgent
Get detailed information about a specific agent.

**Parameters:**
- `--agentId` (required): UUID of the agent
- `--agentType` (required): `"server"` | `"external"`

**Examples:**
```
getAgent --agentId "uuid-here" --agentType "server"
getAgent --agentId "uuid-here" --agentType "external"
```

**Returns for server agents:** All basic fields plus systemPrompt, tools, temperature, maxOutputTokens, thinkingConfig

**Returns for external agents:** Basic fields plus secretKeyPrefix

### updateAgent
Update server agent configuration. External agents use setAgentEnabled/toggleAgentFavorite only.

**Parameters:**
- `--agentId` (required): UUID of the agent
- `--agentType` (required): `"server"`
- `--updates` (required): Object with fields to update

**Updatable fields:**
- `key`: New unique key (1-64 chars, alphanumeric/hyphens/underscores)
- `name`: Display name (1-255 chars)
- `description`: Agent description (max 1000 chars)
- `provider`: `"anthropic"` | `"openai"` | `"gemini"`
- `model`: Model ID matching the provider
- `systemPrompt`: System instructions
- `tools`: Array of tool IDs
- `temperature`: 0-2 (null for default)
- `maxOutputTokens`: Positive integer (null for default)
- `thinkingConfig`: Reasoning config (see `references/thinking-config.md`)
- `isFavorite`: Boolean

**Example:**
```
updateAgent --agentId "uuid" --agentType "server" --updates '{"name":"New Name","temperature":0.7}'
```

### setAgentEnabled
Enable or disable an agent. Disabled agents are hidden from the selector.

**Parameters:**
- `--agentId` (required): UUID
- `--agentType` (required): `"server"` | `"external"`
- `--enabled` (required): `true` | `false`

**Example:**
```
setAgentEnabled --agentId "uuid" --agentType "server" --enabled false
```

### toggleAgentFavorite
Mark or unmark as favorite. Favorites appear at top of selector.

**Parameters:**
- `--agentId` (required): UUID
- `--agentType` (required): `"server"` | `"external"`
- `--isFavorite` (required): `true` | `false`

**Example:**
```
toggleAgentFavorite --agentId "uuid" --agentType "external" --isFavorite true
```

### spawnAgent
Spawn another agent to handle a subtask. Runs in fresh session without your conversation history.

**Parameters:**
- `--agentId` (required): Agent key (the `key` field, not UUID)
- `--message` (required): Task/message to send (1-50,000 chars)

**Example:**
```
spawnAgent --agentId "researcher" --message "Research React 19 features and summarize"
```

**Best practices:**
- Provide complete, self-contained instructions
- Include all necessary context in the message
- Use the agent `key` from listAgents output
- Spawned agents have no access to your conversation history

## Common Workflows

### Find and spawn a specialized agent
```
listAgents --type "server"
# Note the agent key
spawnAgent --agentId "agent-key" --message "Your detailed task"
```

### Configure an agent
```
getAgent --agentId "uuid" --agentType "server"
# Review current config
updateAgent --agentId "uuid" --agentType "server" --updates '{"temperature":0.5}'
```

### Organize agents
```
toggleAgentFavorite --agentId "uuid" --agentType "server" --isFavorite true
setAgentEnabled --agentId "uuid" --agentType "external" --enabled false
```

## Reference Documentation

- `references/agent-types.md` - Server vs External agents
- `references/thinking-config.md` - Provider-specific thinking configuration
- `references/all-tools.md` - Complete list of all 41 tools
- `references/permission-scopes.md` - All 20 permission scopes
- `references/system-skills.md` - Overview of 6 system skills
- `references/custom-skills.md` - How to create custom skills
- `references/prompt-writing.md` - How to write effective agent prompts
