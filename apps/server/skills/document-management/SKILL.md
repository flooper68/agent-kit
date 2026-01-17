---
name: document-management
description: Create, read, update, and search documents/artifacts. Use for saving notes, reports, or any content you want to persist.
allowed-tools:
  - writeArtifact
  - readArtifact
  - searchArtifacts
  - updateArtifact
---

# Document Management Skill

Manage documents (artifacts) - create, read, update, and search.

## Available Tools

- **writeArtifact**: Create a new document
- **readArtifact**: Read an existing document by ID
- **searchArtifacts**: Search documents by title/content
- **updateArtifact**: Update an existing document

## Parameter Details

### writeArtifact Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `title` | string | **Yes** | 1-255 chars, no whitespace-only | Document title |
| `content` | string | **Yes** | 1 byte - 1 MB | Markdown content |
| `summary` | string | No | Max 500 chars | Brief summary for search |

**Behaviors:**
- If `summary` is omitted, auto-generates as `Document titled "TITLE"`
- Duplicate titles are allowed (each receives a unique UUID)
- Full Unicode support (emoji, CJK, RTL languages, etc.)

## Common Operations

### Create a Document
```
writeArtifact --title "Meeting Notes" --content "# Meeting Notes\n\n..." --summary "Notes from team sync"
```

### Search Documents
```
searchArtifacts --query "meeting notes"
```

### Read a Document
```
readArtifact --artifactId "uuid-here"
```

### Update a Document
```
updateArtifact --artifactId "uuid-here" --content "Updated content..."
```

## Error Cases

```bash
# Empty title - rejected
writeArtifact --title "" --content "test"
# Error: title: Title is required

# Whitespace-only title - rejected
writeArtifact --title "   " --content "test"
# Error: title: Title cannot be only whitespace

# Empty content - rejected
writeArtifact --title "Test" --content ""
# Error: content: Content is required

# Title too long (>255 chars) - rejected
writeArtifact --title "a]repeated 256 times..." --content "test"
# Error: title: Title must be 255 characters or less
```

## Best Practices

- Use descriptive titles for easy searching
- Include a summary for quick reference
- Use markdown formatting for structure
- Search before creating to avoid duplicates
