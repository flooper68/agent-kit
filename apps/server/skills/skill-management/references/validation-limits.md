# Validation Limits

All validation constraints for skill creation and updates.

## Skill Fields

| Field | Min | Max | Pattern | Notes |
|-------|-----|-----|---------|-------|
| key | 1 | 64 | `^[a-z0-9-]+$` | Lowercase letters, numbers, hyphens only |
| name | 1 | 255 | - | Display name, any characters |
| description | 1 | 1000 | - | Used for createSkill (1024 in frontmatter) |

## File Constraints

| Constraint | Limit |
|------------|-------|
| Files per skill | 1-20 |
| File path length | 1-255 characters |
| File content size | Max 500KB (500,000 bytes) |

## Allowed File Paths

Files must be in one of these directories:

| Directory | Example Paths |
|-----------|---------------|
| Root | `SKILL.md`, `config.json`, `README.md` |
| references/ | `references/tips.md`, `references/examples.md` |
| assets/ | `assets/template.json`, `assets/schema.yaml` |

**Invalid paths:**
- Absolute paths: `/etc/passwd` (rejected)
- Parent traversal: `../other/file.md` (rejected)
- Other directories: `scripts/run.sh` (rejected)
- Empty path: `` (rejected)

## Key Naming Rules

Valid keys:
- `my-skill`
- `api-v2`
- `data-processing-tool`
- `a1b2c3`

Invalid keys:
- `My-Skill` (uppercase)
- `my_skill` (underscores)
- `my skill` (spaces)
- `my.skill` (dots)

## Uniqueness Constraints

- **key**: Must be unique per user (user skills) or globally (system skills)
- Creating a skill with an existing key returns an error
- Updating to a key that already exists returns an error

## Error Messages

| Error | Cause |
|-------|-------|
| "Key must contain only lowercase letters, numbers, and hyphens" | Invalid key format |
| "A skill with key X already exists" | Duplicate key |
| "Path must be in root, assets/, or references/ directory" | Invalid file path |
| "System skills cannot be modified" | Attempted to update/delete system skill |
