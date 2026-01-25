# All Available Tools

Complete reference of all 43 tools organized by category.

## Utility Tools (4)

| Tool             | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `getTime`        | Get current date and time. Optional timezone parameter.    |
| `webSearch`      | Search the web for information. Returns results with URLs. |
| `extractContent` | Extract readable text content from a URL.                  |
| `fetch`          | Make HTTP requests (GET, POST, PUT, DELETE).               |

## Artifact Tools (5)

| Tool              | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `writeArtifact`   | Create a new document with title, content, summary.           |
| `getArtifact`     | Read a document by ID.                                        |
| `searchArtifacts` | Search documents by title or content. Use "\*" to list all.   |
| `updateArtifact`  | Update document title, content, or summary.                   |
| `patchArtifact`   | Patch specific lines of a document (replace, insert, delete). |

## Project Tools (6)

| Tool             | Description                                  |
| ---------------- | -------------------------------------------- |
| `listProjects`   | List all projects with task counts.          |
| `searchProjects` | Search projects by title or summary.         |
| `getProject`     | Get project details including all tasks.     |
| `createProject`  | Create a new project with title and summary. |
| `updateProject`  | Update project title or summary.             |
| `deleteProject`  | Delete a project and all its tasks.          |

## Task Tools (10)

| Tool                     | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `listTasks`              | List tasks in a project. Filter by status.             |
| `searchTasks`            | Search tasks across projects.                          |
| `getTask`                | Get detailed task information.                         |
| `createTask`             | Create task with title, description, priority, status. |
| `updateTask`             | Update task fields.                                    |
| `deleteTask`             | Delete a task.                                         |
| `moveTask`               | Move task to different status column.                  |
| `reorderTask`            | Change task position within column.                    |
| `attachArtifactToTask`   | Link a document to a task.                             |
| `detachArtifactFromTask` | Unlink a document from a task.                         |

## Navigation Tools (2)

| Tool                | Description                            |
| ------------------- | -------------------------------------- |
| `navigateTo`        | Navigate the user's browser to a path. |
| `getCurrentUIState` | Get current page path and context.     |

## Agent Tools (8)

| Tool                  | Description                            |
| --------------------- | -------------------------------------- |
| `spawnAgent`          | Spawn another agent for a subtask.     |
| `listAgents`          | List all available agents.             |
| `getAgent`            | Get detailed agent configuration.      |
| `createAgent`         | Create a new server or external agent. |
| `updateAgent`         | Update server agent settings.          |
| `deleteAgent`         | Delete an agent (soft delete).         |
| `setAgentEnabled`     | Enable or disable an agent.            |
| `toggleAgentFavorite` | Mark agent as favorite.                |

## Skill Usage Tools (3)

| Tool             | Description                         |
| ---------------- | ----------------------------------- |
| `listSkillFiles` | List all files in a skill.          |
| `readSkillFile`  | Read a skill file by path.          |
| `executeCommand` | Execute tools via CLI-style syntax. |

## Skill Management Tools (5)

| Tool          | Description                                 |
| ------------- | ------------------------------------------- |
| `listSkills`  | List all available skills.                  |
| `getSkill`    | Get skill details and metadata.             |
| `createSkill` | Create a new custom skill.                  |
| `updateSkill` | Update skill name, description, or content. |
| `deleteSkill` | Delete a custom skill.                      |

## Tool Categories Summary

| Category         | Count  | Purpose                         |
| ---------------- | ------ | ------------------------------- |
| Utility          | 4      | Time, web search, HTTP requests |
| Artifact         | 5      | Document management             |
| Project          | 6      | Project CRUD                    |
| Task             | 10     | Task management and Kanban      |
| Navigation       | 2      | UI navigation                   |
| Agent            | 8      | Agent management and spawning   |
| Skill Usage      | 3      | Reading and executing skills    |
| Skill Management | 5      | Creating and managing skills    |
| **Total**        | **43** |                                 |
