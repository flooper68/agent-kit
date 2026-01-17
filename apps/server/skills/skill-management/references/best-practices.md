# Skill Best Practices

Guidelines for creating effective skills.

## Core Principles

### 1. Token Economy

Skills share context with system prompts. Every token counts.

- Keep SKILL.md under 500 lines
- Challenge every piece of information: "Does the agent need this?"
- Don't repeat information in tool schemas
- Use references for deep dives

### 2. Description Quality

The description determines activation. Make it count.

**Include:**

- What the skill does (capabilities)
- When to use it (triggers)
- Keywords users might mention

**Example:**

```yaml
description: Process and transform data files. Use when working with CSV, JSON, Excel files, data cleaning, transformation, or analysis tasks.
```

### 3. Progressive Disclosure

Structure content for gradual loading:

1. Description activates the skill
2. SKILL.md provides working knowledge
3. References provide deep expertise

## Writing Effective Descriptions

### Do's

- Include action verbs (create, transform, analyze)
- List key use cases
- Add trigger keywords
- Write in third person
- Keep under 1024 characters

### Don'ts

- Vague descriptions ("useful utilities")
- First person ("I help you...")
- No trigger conditions
- Exceeding character limit

## Structuring SKILL.md

Recommended order:

1. **Overview** (1-2 sentences)
2. **Available Tools** (list with descriptions)
3. **Common Workflows** (step-by-step)
4. **Examples** (concrete usage)
5. **Reference Links** (for deep dives)

Keep it scannable. Use headers, lists, and tables.

## Anti-Patterns to Avoid

| Pattern                | Problem            | Solution                |
| ---------------------- | ------------------ | ----------------------- |
| Windows paths          | Platform-specific  | Use forward slashes     |
| Too many options       | Decision paralysis | Provide defaults        |
| Complex instructions   | Hard to follow     | Break into steps        |
| Time-sensitive info    | Becomes stale      | Use relative terms      |
| Deeply nested refs     | Hard to navigate   | Keep flat               |
| Unlisted refs          | Undiscoverable     | Link from SKILL.md      |
| "When to use" in body  | Redundant          | Put in description      |
| Repeating tool schemas | Wastes tokens      | Reference tools by name |

## Skill Development Workflow

1. **Identify the gap** - What can't the agent do well?
2. **Start minimal** - Simplest skill that helps
3. **Test with prompts** - See how the agent uses it
4. **Refine description** - Tune trigger keywords
5. **Add references** - Only if needed
6. **Iterate** - Improve based on usage

## Example: API Documentation Skill

```yaml
---
name: payments-api
description: Payment gateway integration guide. Use when implementing payments, handling transactions, webhooks, or troubleshooting payment errors.
allowed-tools:
  - fetch
  - writeArtifact
---
```

SKILL.md body:

```markdown
# Payments API

Integrate with our payment gateway.

## Authentication

Bearer token in Authorization header.

## Common Operations

### Create Payment

POST /v1/payments
Required: amount, currency, source

### List Transactions

GET /v1/transactions?limit=20

## Reference Files

- `references/webhooks.md` - Webhook setup
- `references/errors.md` - Error codes
```

## Testing Your Skill

1. **Activation test** - Does it trigger on expected prompts?
2. **Tool usage test** - Does it use the right tools?
3. **Completeness test** - Does it have enough information?
4. **Token efficiency** - Is it concise enough?
