# Creating Custom Skills

Custom skills extend agent capabilities with domain-specific knowledge.

## Quick Start

```
createSkill --key "my-skill" --name "My Skill" --description "What it does. Use when user needs X." --files '[{"path":"SKILL.md","content":"---\nname: my-skill\ndescription: What it does. Use when user needs X.\nallowed-tools:\n  - tool1\n  - tool2\n---\n\n# My Skill\n\nDocumentation here..."}]'
```

## SKILL.md Format

Every skill needs a SKILL.md file with YAML frontmatter:

```markdown
---
name: my-skill
description: What the skill does. Use when [trigger conditions].
allowed-tools:
  - webSearch
  - writeArtifact
---

# My Skill

## Overview

Brief purpose statement.

## Available Tools

List tools and their usage.

## Workflows

Step-by-step patterns.

## Examples

Concrete usage examples.
```

## The Description Field

The description is **critical** - it determines when your skill activates.

**Requirements:**

- Max 1024 characters
- Explain what it does AND when to use it
- Include trigger keywords
- Write in third person

**Good:**

```
Extract data from PDFs and fill forms. Use when working with PDF files, form filling, or document extraction.
```

**Bad:**

```
PDF utilities
```

## File Structure

Recommended layout:

```
my-skill/
├── SKILL.md              # Required: Main documentation
└── references/           # Optional: Additional docs
    ├── examples.md
    └── troubleshooting.md
```

## Validation Limits

| Field           | Limit                                    |
| --------------- | ---------------------------------------- |
| Key             | 1-64 chars (lowercase, hyphens, numbers) |
| Name            | 1-255 chars                              |
| Description     | 1-1024 chars                             |
| Files per skill | 1-20                                     |
| File path       | 1-255 chars                              |
| File content    | Max 500KB per file                       |

## Skill Management Commands

### Create

```
createSkill --key "api-docs" --name "API Documentation" --description "Reference for MyAPI. Use when integrating with MyAPI endpoints." --files '[{"path":"SKILL.md","content":"..."}]'
```

### Update

```
updateSkill --id "uuid" --description "Better description"
updateSkill --id "uuid" --files '[{"path":"SKILL.md","content":"new content"}]'
```

Note: `--files` does full replacement, not merge.

### Delete

```
deleteSkill --id "uuid"
```

Warning: Deletion is permanent.

### List

```
listSkills
listSkills --filter "user" --search "api"
```

### View

```
getSkill --skillKey "my-skill"
```

## Best Practices

1. **Start minimal** - Create the simplest useful skill
2. **Good description** - Include trigger keywords
3. **Test with prompts** - See how the agent uses it
4. **Refine iteratively** - Tune based on actual usage
5. **Keep it concise** - Under 500 lines recommended
6. **Don't repeat** - Avoid info already in tool schemas
