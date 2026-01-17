# Permission Scopes

Agents use an opt-in permission model. Each scope grants access to specific tools.

## All Scopes (20 Total)

### Artifacts (3)

| Scope              | Description                  | Tools                         |
| ------------------ | ---------------------------- | ----------------------------- |
| `artifacts:read`   | Read and search documents    | readArtifact, searchArtifacts |
| `artifacts:write`  | Create and update documents  | writeArtifact, updateArtifact |
| `artifacts:delete` | Delete documents permanently | (delete operations)           |

### Utilities (4)

| Scope                 | Description           | Tools          |
| --------------------- | --------------------- | -------------- |
| `utilities:time`      | Get current date/time | getTime        |
| `utilities:webSearch` | Search the web        | webSearch      |
| `utilities:fetch`     | Fetch URLs            | fetch          |
| `utilities:extract`   | Extract web content   | extractContent |

### Projects (3)

| Scope             | Description            | Tools                                    |
| ----------------- | ---------------------- | ---------------------------------------- |
| `projects:read`   | View projects          | listProjects, searchProjects, getProject |
| `projects:write`  | Create/update projects | createProject, updateProject             |
| `projects:delete` | Delete projects        | deleteProject                            |

### Tasks (3)

| Scope          | Description              | Tools                                                                                       |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `tasks:read`   | View tasks               | listTasks, searchTasks, getTask                                                             |
| `tasks:write`  | Create/update/move tasks | createTask, updateTask, moveTask, reorderTask, attachArtifactToTask, detachArtifactFromTask |
| `tasks:delete` | Delete tasks             | deleteTask                                                                                  |

### UI (2)

| Scope         | Description    | Tools             |
| ------------- | -------------- | ----------------- |
| `ui:navigate` | Navigate pages | navigateTo        |
| `ui:state`    | Read UI state  | getCurrentUIState |

### Agents (2)

| Scope           | Description           | Tools                                             |
| --------------- | --------------------- | ------------------------------------------------- |
| `agents:read`   | View agent configs    | listAgents, getAgent                              |
| `agents:manage` | Update agent settings | updateAgent, setAgentEnabled, toggleAgentFavorite |

### Skills (3)

| Scope           | Description          | Tools                    |
| --------------- | -------------------- | ------------------------ |
| `skills:read`   | List and view skills | listSkills, getSkill     |
| `skills:write`  | Create/update skills | createSkill, updateSkill |
| `skills:delete` | Delete skills        | deleteSkill              |

## Default Scopes for New Agents

New agents receive these 11 scopes by default:

**Included (11):**

- `utilities:time`
- `utilities:webSearch`
- `utilities:fetch`
- `utilities:extract`
- `artifacts:read`
- `artifacts:write`
- `tasks:read`
- `tasks:write`
- `projects:read`
- `ui:navigate`
- `ui:state`

**Not included by default (9):**

- `artifacts:delete`
- `projects:write`
- `projects:delete`
- `tasks:delete`
- `agents:read`
- `agents:manage`
- `skills:read`
- `skills:write`
- `skills:delete`

## Scope Design Principles

1. **Opt-in model**: Agents start with limited permissions
2. **Least privilege**: Only grant what's needed
3. **Read/Write/Delete separation**: Destructive operations require explicit permission
4. **Category grouping**: Related tools share scope categories
