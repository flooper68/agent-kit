# Agent Types

## Server Agents (LLM-based)

Server agents run entirely on the platform using LLM providers.

**Characteristics:**
- Full configuration control
- Support thinking/reasoning modes
- No external authentication required
- Managed through UI or API

**Configurable fields:**

| Field | Description |
|-------|-------------|
| key | Unique identifier for spawning (1-64 chars) |
| name | Display name |
| description | Purpose description |
| provider | `anthropic`, `openai`, or `gemini` |
| model | Model ID (must match provider) |
| systemPrompt | Instructions for the agent |
| tools | Array of enabled tool IDs |
| temperature | Response randomness (0-2) |
| maxOutputTokens | Response length limit |
| maxContextTokens | Context window limit |
| thinkingConfig | Reasoning configuration |
| scopes | Permission scopes granted |
| allowedSubagents | Agents this agent can spawn |
| allowedSkills | Skills this agent can access |

## External Agents (WebSocket-based)

External agents are remote processes connecting via WebSocket.

**Characteristics:**
- Run outside the platform
- Authenticate with HMAC-signed secret keys
- Limited server-side configuration
- Can invoke server tools remotely

**Configurable fields:**

| Field | Description |
|-------|-------------|
| key | Unique identifier for spawning |
| name | Display name |
| description | Purpose description |
| secretKeyPrefix | Prefix for identifying the key |
| allowedTools | Server tools this agent can invoke |
| scopes | Permission scopes granted |
| allowedSubagents | Agents this agent can spawn |
| allowedSkills | Skills this agent can access |

## When to Use Each Type

| Scenario | Recommended |
|----------|-------------|
| Quick setup, standard LLM tasks | Server |
| Custom/fine-tuned models | External |
| Integration with external systems | External |
| Simple task delegation | Server |
| Full control over runtime | External |
| Multi-provider flexibility | Server |
