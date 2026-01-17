---
name: project-management
description: Create and manage projects with Kanban-style task boards. Use for organizing work, tracking tasks, project planning, or any task management needs.
allowed-tools:
  - listProjects
  - searchProjects
  - getProject
  - createProject
  - updateProject
  - deleteProject
  - listTasks
  - searchTasks
  - getTask
  - createTask
  - updateTask
  - deleteTask
  - moveTask
  - reorderTask
  - attachArtifactToTask
  - detachArtifactFromTask
  - attachArtifactToProject
  - detachArtifactFromProject
---

# Project Management

Manage projects and tasks using a Kanban-style board system.

## Permission Scopes

| Tool                      | Required Scope    |
| ------------------------- | ----------------- |
| listProjects              | `projects:read`   |
| searchProjects            | `projects:read`   |
| getProject                | `projects:read`   |
| createProject             | `projects:write`  |
| updateProject             | `projects:write`  |
| deleteProject             | `projects:delete` |
| attachArtifactToProject   | `projects:write`  |
| detachArtifactFromProject | `projects:write`  |
| listTasks                 | `tasks:read`      |
| searchTasks               | `tasks:read`      |
| getTask                   | `tasks:read`      |
| createTask                | `tasks:write`     |
| updateTask                | `tasks:write`     |
| moveTask                  | `tasks:write`     |
| reorderTask               | `tasks:write`     |
| attachArtifactToTask      | `tasks:write`     |
| detachArtifactFromTask    | `tasks:write`     |
| deleteTask                | `tasks:delete`    |

## Project Tools

### listProjects

List all projects with task counts.

**Parameters:** None

**Example:**

```
listProjects
```

**Returns:** Array of projects with id, title, summary, task counts by status.

### searchProjects

Search projects by title or summary.

**Parameters:**

- `--query` (required): Search query string

**Example:**

```
searchProjects --query "website redesign"
```

### getProject

Get detailed project information including all tasks.

**Parameters:**

- `--projectId` (required): UUID of the project

**Example:**

```
getProject --projectId "550e8400-e29b-41d4-a716-446655440000"
```

**Returns:** Project details with all tasks organized by status.

### createProject

Create a new project.

**Parameters:**

- `--title` (required): Project title (1-255 chars)
- `--summary` (optional): Project description (max 1000 chars)

**Example:**

```
createProject --title "Q1 Website Redesign" --summary "Refresh company website with new branding"
```

### updateProject

Update project title or summary.

**Parameters:**

- `--projectId` (required): UUID of the project
- `--title` (optional): New title
- `--summary` (optional): New summary

**Example:**

```
updateProject --projectId "uuid" --title "Q1 Website Redesign v2"
```

### deleteProject

Delete a project and all its tasks.

**Parameters:**

- `--projectId` (required): UUID of the project

**Example:**

```
deleteProject --projectId "uuid"
```

**Warning:** This permanently deletes the project and all tasks.

### attachArtifactToProject

Link a document to a project.

**Parameters:**

- `--projectId` (required): UUID of the project
- `--artifactId` (required): UUID of the document

**Example:**

```
attachArtifactToProject --projectId "project-uuid" --artifactId "artifact-uuid"
```

**Returns:** Success status and whether artifact was already attached.

### detachArtifactFromProject

Unlink a document from a project.

**Parameters:**

- `--projectId` (required): UUID of the project
- `--artifactId` (required): UUID of the document

**Example:**

```
detachArtifactFromProject --projectId "project-uuid" --artifactId "artifact-uuid"
```

## Task Tools

### listTasks

List tasks in a project with optional filtering.

**Parameters:**

- `--projectId` (required): UUID of the project
- `--status` (optional): Filter by status - `"backlog"` | `"todo"` | `"in_progress"` | `"review"` | `"done"`

**Examples:**

```
listTasks --projectId "uuid"
listTasks --projectId "uuid" --status "in_progress"
```

### searchTasks

Search tasks across all projects.

**Parameters:**

- `--query` (required): Search query string

**Example:**

```
searchTasks --query "authentication"
```

### getTask

Get detailed task information.

**Parameters:**

- `--taskId` (required): UUID of the task

**Example:**

```
getTask --taskId "uuid"
```

**Returns:** Task with id, title, description, status, priority, position, timestamps, attached artifacts.

### createTask

Create a new task in a project.

**Parameters:**

- `--projectId` (required): UUID of the project
- `--title` (required): Task title (1-255 chars)
- `--description` (optional): Task description
- `--status` (optional): Initial status (default: `"backlog"`)
- `--priority` (optional): `"low"` | `"medium"` | `"high"` | `"urgent"` (default: `"medium"`)

**Examples:**

```
createTask --projectId "uuid" --title "Implement login page"
createTask --projectId "uuid" --title "Fix auth bug" --priority "urgent" --status "todo"
createTask --projectId "uuid" --title "Design review" --description "Review new designs with team" --priority "high"
```

### updateTask

Update task details.

**Parameters:**

- `--taskId` (required): UUID of the task
- `--title` (optional): New title
- `--description` (optional): New description
- `--priority` (optional): New priority

**Example:**

```
updateTask --taskId "uuid" --title "Updated title" --priority "high"
```

### moveTask

Move task to a different status column.

**Parameters:**

- `--taskId` (required): UUID of the task
- `--status` (required): New status

**Example:**

```
moveTask --taskId "uuid" --status "in_progress"
moveTask --taskId "uuid" --status "done"
```

### reorderTask

Change task position within its status column.

**Parameters:**

- `--taskId` (required): UUID of the task
- `--position` (required): New position (0-indexed)

**Example:**

```
reorderTask --taskId "uuid" --position 0
```

### deleteTask

Delete a task permanently.

**Parameters:**

- `--taskId` (required): UUID of the task

**Example:**

```
deleteTask --taskId "uuid"
```

### attachArtifactToTask

Link a document to a task.

**Parameters:**

- `--taskId` (required): UUID of the task
- `--artifactId` (required): UUID of the document

**Example:**

```
attachArtifactToTask --taskId "task-uuid" --artifactId "artifact-uuid"
```

### detachArtifactFromTask

Unlink a document from a task.

**Parameters:**

- `--taskId` (required): UUID of the task
- `--artifactId` (required): UUID of the document

**Example:**

```
detachArtifactFromTask --taskId "task-uuid" --artifactId "artifact-uuid"
```

## Task Status Flow

```
backlog -> todo -> in_progress -> review -> done
```

See `references/task-states.md` for detailed state documentation.

## Reference Documentation

- `references/task-states.md` - Status and priority definitions
- `references/project-workflows.md` - Project lifecycle patterns
- `references/task-management.md` - Task creation best practices
- `references/bulk-operations.md` - Managing multiple tasks
- `references/integration.md` - Using with documents and agents
