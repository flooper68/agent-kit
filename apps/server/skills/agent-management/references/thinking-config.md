# Thinking Configuration

Thinking (reasoning) modes enable models to show their reasoning process. Configuration varies by provider.

## Anthropic

Uses budget-based token allocation for extended thinking.

```json
{
  "enabled": true,
  "budgetTokens": 8192
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| enabled | boolean | - | Enable thinking mode |
| budgetTokens | number | 1024-32768 | Token budget for reasoning |

## OpenAI

Uses reasoning effort levels.

```json
{
  "enabled": true,
  "reasoningEffort": "medium"
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| enabled | boolean | - | Enable reasoning mode |
| reasoningEffort | string | `"low"`, `"medium"`, `"high"` | Reasoning intensity |

## Gemini

Supports two configuration styles.

### Gemini 3.x (thinkingLevel)
```json
{
  "enabled": true,
  "thinkingLevel": "medium"
}
```

| Field | Values |
|-------|--------|
| thinkingLevel | `"minimal"`, `"low"`, `"medium"`, `"high"` |

### Gemini 2.5 (thinkingBudget)
```json
{
  "enabled": true,
  "thinkingBudget": 8192
}
```

| Field | Range |
|-------|-------|
| thinkingBudget | 0-32768 (-1 for dynamic) |

## Disabling Thinking

To disable thinking for any provider:
```json
{
  "enabled": false
}
```

Or set to `null` to use provider defaults.

## Example Commands

**Anthropic with extended thinking:**
```
updateAgent --agentId "uuid" --agentType "server" --updates '{"thinkingConfig":{"enabled":true,"budgetTokens":16384}}'
```

**OpenAI with high reasoning:**
```
updateAgent --agentId "uuid" --agentType "server" --updates '{"thinkingConfig":{"enabled":true,"reasoningEffort":"high"}}'
```

**Disable thinking:**
```
updateAgent --agentId "uuid" --agentType "server" --updates '{"thinkingConfig":null}'
```
