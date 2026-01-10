# Skills

Skills are documentation bundles that teach agents how to use related tools. They provide instructions, examples, and best practices in a structured format that agents can search and read.

## Overview

Instead of agents knowing about all tools upfront, skills enable **progressive disclosure**:

1. Agent searches for relevant skills using `grepSkills`
2. Agent reads skill documentation using `readSkillFile`
3. Agent uses tools directly or via `executeSkill` CLI syntax

This approach reduces context size and helps agents discover the right tools for each task.

## Available Skills

| Skill                 | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `web-research`        | Search the web and extract content from URLs         |
| `document-management` | Create, read, update, and search documents/artifacts |
| `project-management`  | Manage projects and tasks with Kanban boards         |
| `agent-management`    | List, configure, and spawn other agents              |
| `utilities`           | General utilities like time and UI navigation        |

## Skill Tools

Three tools enable agents to work with skills:

### grepSkills

Search across all skill files for content matching a pattern. Like `grep -r` in bash.

```
grepSkills --pattern "search"
grepSkills --pattern "create task" --skillKey "project-management"
```

Returns matching lines with skill key, file path, line number, and content.

### readSkillFile

Read a skill file by path. Supports partial reading with `lines` and `offset` parameters.

```
readSkillFile --path "web-research/SKILL.md"
readSkillFile --path "project-management/references/task-states.md"
readSkillFile --path "web-research/SKILL.md" --lines 20
readSkillFile --path "web-research/SKILL.md" --offset 20 --lines 20
```

### executeSkill

Execute a tool using CLI-style syntax. Parses commands and calls tools directly.

```
executeSkill --command "webSearch --query 'typescript tutorials'"
executeSkill --command "createTask --projectId abc123 --title 'New task'"
executeSkill --command "getTime --timezone 'America/New_York'"
```

## Skill File Structure

Each skill mimics a file system structure:

```
skills/
├── web-research/
│   ├── SKILL.md              # Main instructions
│   └── references/
│       └── search-tips.md    # Additional documentation
├── project-management/
│   ├── SKILL.md
│   └── references/
│       ├── task-states.md
│       └── workflow.md
└── utilities/
    └── SKILL.md
```

### SKILL.md

The main file for each skill containing:

- Tool descriptions and usage
- Common workflows
- Best practices
- CLI command examples

### References

Additional documentation files for detailed information:

- `references/search-tips.md` - Search query optimization
- `references/task-states.md` - Task status values and transitions
- `references/workflow.md` - Project workflow guidelines

## Agent Workflow

A typical agent interaction with skills:

1. **Discovery**: Agent receives a task and searches for relevant skills

   ```
   grepSkills --pattern "web search"
   ```

2. **Learning**: Agent reads the skill documentation

   ```
   readSkillFile --path "web-research/SKILL.md"
   ```

3. **Execution**: Agent uses the tools

   ```
   executeSkill --command "webSearch --query 'React best practices 2024'"
   ```

4. **Deep Dive**: If needed, agent reads reference files
   ```
   readSkillFile --path "web-research/references/search-tips.md"
   ```

## Adding Skills to Agents

In the Agent Builder UI, select the skill tools under the "Skills" category:

- **Grep Skills** - Enable skill discovery
- **Read Skill File** - Enable reading skill documentation
- **Execute Skill** - Enable CLI-style tool execution

Agents also need the actual tools they'll use (e.g., `webSearch`, `createTask`).

## Implementation Details

Skills are currently hardcoded in `apps/server/src/agent/skills/index.ts`. Each skill is defined with:

```typescript
interface SkillDefinition {
  key: string; // Unique identifier (e.g., "web-research")
  name: string; // Display name
  description: string; // Short description for discovery
  files: SkillFile[]; // Documentation files
}
```

Future enhancements may include:

- Database-stored skills
- UI for skill management
- Custom user-defined skills
