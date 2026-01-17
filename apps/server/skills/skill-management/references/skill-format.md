# SKILL.md Format

Every skill requires a SKILL.md file with YAML frontmatter.

## Basic Template

```markdown
---
name: my-skill
description: What it does. Use when [trigger conditions].
allowed-tools:
  - tool1
  - tool2
---

# My Skill

Overview of what the skill does.

## Available Tools

- **tool1** - What it does
- **tool2** - What it does

## Common Workflows

### Workflow Name

1. Step one
2. Step two

## Examples

Concrete usage examples.
```

## YAML Frontmatter Fields

### Required Fields

| Field       | Limit        | Description                                      |
| ----------- | ------------ | ------------------------------------------------ |
| name        | 1-64 chars   | Skill identifier (lowercase, hyphens, numbers)   |
| description | 1-1024 chars | Discovery text - determines when skill activates |

### Optional Fields

| Field         | Description                              |
| ------------- | ---------------------------------------- |
| allowed-tools | Array of tool IDs this skill uses        |
| license       | License identifier (e.g., "Apache-2.0")  |
| compatibility | Model compatibility (e.g., "claude-3.5") |
| metadata      | Custom key-value pairs                   |

### Complete Example

```yaml
---
name: data-processing
description: Transform and analyze data files. Use when working with CSV, JSON, or Excel files, data transformation, or analysis tasks.
allowed-tools:
  - fetch
  - writeArtifact
  - readArtifact
license: MIT
compatibility: claude-3.5
metadata:
  author: data-team
  version: '2.1'
---
```

## The Description Field

The description is **critical** - it determines when your skill activates.

### Requirements

- Maximum 1024 characters
- Explain what it does AND when to use it
- Include trigger keywords users might mention
- Write in third person

### Good Example

```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

### Bad Example

```yaml
description: PDF utilities
```

The good example includes trigger keywords ("PDF", "forms", "extraction") and explains activation triggers.

## Body Content Structure

Recommended sections:

1. **Overview** - Brief purpose (1-2 sentences)
2. **Available Tools** - List with descriptions
3. **Common Workflows** - Step-by-step patterns
4. **Reference Files** - Links to additional docs
5. **Examples** - Concrete usage

## Linking Reference Files

Always link reference files from SKILL.md so agents can discover them:

```markdown
## Reference Documentation

- `references/authentication.md` - Auth methods and token handling
- `references/error-codes.md` - API error codes and solutions
- `assets/request-template.json` - Example request body
```
