# Skill File Structure

How to organize files within a skill for progressive disclosure.

## Standard Directory Layout

```
my-skill/
├── SKILL.md              # Required: Main index and documentation
└── references/           # Optional: Additional documentation
    ├── guide.md
    ├── examples.md
    └── troubleshooting.md
└── assets/               # Optional: Templates and configs
    ├── template.json
    └── config.yaml
```

## File Purposes

### SKILL.md (Required)

The main entry point. Contains:

- YAML frontmatter (name, description, allowed-tools)
- Overview of the skill
- Available tools list
- Common workflows
- Links to reference files

### references/ Directory

Additional documentation loaded on-demand:

- Deep-dive guides
- Extended examples
- Troubleshooting guides
- API references
- Error code documentation

### assets/ Directory

Non-documentation files:

- JSON/YAML templates
- Configuration examples
- Schema definitions
- Sample data files

## Progressive Disclosure

Skills use a three-tier loading system:

| Tier               | Content                          | When Loaded               |
| ------------------ | -------------------------------- | ------------------------- |
| 1. Metadata        | name, description, allowed-tools | Always (at startup)       |
| 2. SKILL.md body   | Full documentation               | When skill activates      |
| 3. Reference files | Additional docs                  | On-demand (explicit read) |

**Principle:** Keep SKILL.md focused. Move detailed content to references.

## File Naming Conventions

| Type       | Convention                | Examples         |
| ---------- | ------------------------- | ---------------- |
| Main doc   | SKILL.md (uppercase)      | `SKILL.md`       |
| References | lowercase-with-hyphens.md | `error-codes.md` |
| Assets     | lowercase with extension  | `template.json`  |

## Maximum Files

Skills can have 1-20 files total across all directories.

Recommended distribution:

- 1 SKILL.md
- 3-5 reference files
- 2-3 asset files

If you need more than 20 files, consider splitting into multiple skills.

## Linking Files

Always link reference files from SKILL.md:

```markdown
## Reference Documentation

For more details, see:

- `references/authentication.md` - How to authenticate
- `references/error-codes.md` - Error code reference
- `assets/request-template.json` - Example request body
```

This ensures agents can discover all files through gradual disclosure.
