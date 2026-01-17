---
name: document-management
description: Create, read, update, and search documents/artifacts. Use for saving notes, reports, or any content you want to persist.
allowed-tools:
  - writeArtifact
  - getArtifact
  - searchArtifacts
  - updateArtifact
  - patchArtifact
---

# Document Management Skill

Manage documents (artifacts) - create, read, update, and search.

## Available Tools

- **writeArtifact**: Create a new document
- **getArtifact**: Read an existing document by ID
- **searchArtifacts**: Search documents by title/content
- **updateArtifact**: Update an existing document (full replacement)
- **patchArtifact**: Patch specific lines of an existing document

## Parameter Details

### writeArtifact Parameters

| Parameter | Type   | Required | Constraints                     | Description              |
| --------- | ------ | -------- | ------------------------------- | ------------------------ |
| `title`   | string | **Yes**  | 1-255 chars, no whitespace-only | Document title           |
| `content` | string | **Yes**  | 1 byte - 1 MB                   | Markdown content         |
| `summary` | string | No       | Max 500 chars                   | Brief summary for search |

**Behaviors:**

- If `summary` is omitted, auto-generates as `Document titled "TITLE"`
- Duplicate titles are allowed (each receives a unique UUID)
- Full Unicode support (emoji, CJK, RTL languages, etc.)

### getArtifact Parameters

| Parameter    | Type   | Required | Constraints             | Description                                   |
| ------------ | ------ | -------- | ----------------------- | --------------------------------------------- |
| `artifactId` | string | **Yes**  | Valid UUID              | The artifact ID to read                       |
| `startLine`  | number | No       | Integer >= 1            | Line number to start reading from (1-indexed) |
| `limit`      | number | No       | Integer >= 1, max 10000 | Maximum number of lines to return             |

#### Response Structure

**Success (found):**

| Field           | Type    | Description                                             |
| --------------- | ------- | ------------------------------------------------------- |
| `found`         | boolean | `true` when artifact was found                          |
| `id`            | string  | Artifact UUID                                           |
| `title`         | string  | Artifact title                                          |
| `content`       | string  | Full or partial content                                 |
| `totalLines`    | number  | Total lines in document                                 |
| `truncated`     | boolean | Whether content was truncated                           |
| `startLine`     | number  | Starting line (defaults to 1)                           |
| `linesReturned` | number  | Number of lines returned                                |
| `summary`       | string? | Auto-generated summary                                  |
| `projects`      | array   | Attached projects `[{id, title}]`                       |
| `tasks`         | array   | Attached tasks `[{id, title, projectId, projectTitle}]` |
| `createdAt`     | Date    | Creation timestamp                                      |
| `updatedAt`     | Date    | Last update timestamp                                   |

**Not Found:**

| Field     | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| `found`   | boolean | `false`                                                 |
| `message` | string  | `"Document not found or you do not have access to it."` |

**Validation Error (e.g., startLine beyond document):**

| Field                                  | Type    | Description              |
| -------------------------------------- | ------- | ------------------------ |
| `found`                                | boolean | `true` (artifact exists) |
| `error`                                | string  | Error description        |
| `content`                              | string  | Empty string             |
| `id`, `title`, `totalLines`, `summary` | various | Metadata still included  |

#### Edge Cases

1. **startLine beyond document**: Returns `found: true` with `error` field and empty content. Metadata is still returned.
2. **limit exceeds remaining lines**: Returns available lines without error.
3. **Truncation flag**: Set to `true` when reading any subset of document (either cut off at end, or not starting from line 1).

### patchArtifact Parameters

| Parameter    | Type   | Required | Constraints                                 | Description                                 |
| ------------ | ------ | -------- | ------------------------------------------- | ------------------------------------------- |
| `artifactId` | string | **Yes**  | Valid UUID                                  | The artifact ID to patch                    |
| `startLine`  | number | **Yes**  | Integer >= 1                                | Starting line number (1-indexed, inclusive) |
| `endLine`    | number | **Yes**  | Integer >= 0, >= startLine-1, <= totalLines | Ending line number (1-indexed, inclusive)   |
| `newContent` | string | **Yes**  | Max 1 MB                                    | Content to replace the specified line range |

**Behaviors:**

- **Replace mode**: When `endLine >= startLine`, replaces lines from startLine to endLine (inclusive) with newContent
- **Insert mode**: When `endLine = startLine - 1`, inserts newContent before startLine without deleting any lines
- **Delete mode**: When `newContent` is an empty string, deletes the specified lines
- Full Unicode support (emoji, CJK, RTL languages, etc.)
- **Note**: The artifact's `summary` field is NOT automatically updated after patching. Use `updateArtifact` to change the summary if needed.

**Insert Mode Examples:**

```bash
# Insert a new line at the beginning (before line 1)
patchArtifact --artifactId "uuid" --startLine 1 --endLine 0 --newContent "New first line"

# Insert between lines 3 and 4 (before line 4)
patchArtifact --artifactId "uuid" --startLine 4 --endLine 3 --newContent "Inserted line"
```

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
getArtifact --artifactId "uuid-here"
```

### Update a Document

```
updateArtifact --artifactId "uuid-here" --content "Updated content..."
```

### Patch Specific Lines

```bash
# Replace lines 5-7 with new content
patchArtifact --artifactId "uuid-here" --startLine 5 --endLine 7 --newContent "Replacement text"

# Insert a line before line 3 (without deleting anything)
patchArtifact --artifactId "uuid-here" --startLine 3 --endLine 2 --newContent "Inserted line"

# Delete lines 2-4
patchArtifact --artifactId "uuid-here" --startLine 2 --endLine 4 --newContent ""
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
