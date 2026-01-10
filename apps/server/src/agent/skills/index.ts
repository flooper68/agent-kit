/**
 * Hardcoded skills registry
 *
 * Each skill mimics a file system structure like Claude Code:
 * - SKILL.md: Main instructions with YAML frontmatter
 * - references/: Additional documentation
 * - examples/: Example workflows
 */

import type { SkillDefinition, SkillMetadata } from './types';

export const SKILLS: SkillDefinition[] = [
  // =============================================================================
  // WEB RESEARCH SKILL
  // =============================================================================
  {
    key: 'web-research',
    name: 'Web Research',
    description:
      'Search the web and extract content from URLs for research tasks',
    files: [
      {
        path: 'SKILL.md',
        content: `# Web Research Skill

Use this skill to research topics on the web by searching and extracting content from URLs.

## Available Tools

- **webSearch**: Search the web for information on any topic
- **extractContent**: Extract readable content from a web page URL
- **fetch**: Fetch raw content from a URL (for APIs, data files, etc.)

## Workflow

1. **Search**: Use \`webSearch\` to find relevant sources
   \`\`\`
   webSearch --query "your search terms"
   \`\`\`

2. **Extract**: Use \`extractContent\` to read full articles
   \`\`\`
   extractContent --url "https://example.com/article"
   \`\`\`

3. **Synthesize**: Combine information from multiple sources

## Best Practices

- Use specific, targeted search queries
- Cross-reference information from multiple sources
- Cite your sources when presenting findings
- Use extractContent for articles, fetch for raw data/APIs
`,
      },
      {
        path: 'references/search-tips.md',
        content: `# Search Tips

## Effective Search Queries

- **Be specific**: Use precise terms rather than generic ones
- **Use quotes**: Wrap exact phrases in quotes ("exact phrase")
- **Include year**: Add the year for recent information (e.g., "React 2024")
- **Site-specific**: Use site:example.com to search within a site

## Query Examples

| Goal | Query |
|------|-------|
| Recent docs | "Next.js 14 documentation 2024" |
| Specific error | "TypeError cannot read property undefined React" |
| Comparisons | "PostgreSQL vs MySQL performance 2024" |
| Tutorials | "how to implement OAuth2 Node.js tutorial" |

## When to Use Each Tool

- **webSearch**: Finding sources, getting an overview
- **extractContent**: Reading full articles, documentation
- **fetch**: APIs, JSON data, raw files
`,
      },
    ],
  },

  // =============================================================================
  // DOCUMENT MANAGEMENT SKILL
  // =============================================================================
  {
    key: 'document-management',
    name: 'Document Management',
    description: 'Create, read, update, and search documents/artifacts',
    files: [
      {
        path: 'SKILL.md',
        content: `# Document Management Skill

Manage documents (artifacts) - create, read, update, and search.

## Available Tools

- **writeArtifact**: Create a new document
- **readArtifact**: Read an existing document by ID
- **searchArtifacts**: Search documents by title/content
- **updateArtifact**: Update an existing document

## Common Operations

### Create a Document
\`\`\`
writeArtifact --title "Meeting Notes" --content "# Meeting Notes\\n\\n..." --summary "Notes from team sync"
\`\`\`

### Search Documents
\`\`\`
searchArtifacts --query "meeting notes"
\`\`\`

### Read a Document
\`\`\`
readArtifact --artifactId "uuid-here"
\`\`\`

### Update a Document
\`\`\`
updateArtifact --artifactId "uuid-here" --content "Updated content..."
\`\`\`

## Best Practices

- Use descriptive titles for easy searching
- Include a summary for quick reference
- Use markdown formatting for structure
- Search before creating to avoid duplicates
`,
      },
    ],
  },

  // =============================================================================
  // PROJECT MANAGEMENT SKILL
  // =============================================================================
  {
    key: 'project-management',
    name: 'Project Management',
    description: 'Create and manage projects and tasks with Kanban boards',
    files: [
      {
        path: 'SKILL.md',
        content: `# Project Management Skill

Manage projects and tasks using a Kanban-style board system.

## Project Tools

- **listProjects**: List all projects
- **searchProjects**: Search projects by name
- **getProject**: Get project details
- **createProject**: Create a new project
- **updateProject**: Update project details
- **deleteProject**: Delete a project

## Task Tools

- **listTasks**: List tasks in a project
- **searchTasks**: Search tasks across projects
- **getTask**: Get task details
- **createTask**: Create a new task
- **updateTask**: Update task details
- **deleteTask**: Delete a task
- **moveTask**: Move task to different status
- **reorderTask**: Reorder task within status column
- **attachArtifactToTask**: Link a document to a task
- **detachArtifactFromTask**: Unlink a document from a task

## Workflow Example

### 1. Create a Project
\`\`\`
createProject --title "Website Redesign" --summary "Q1 website refresh"
\`\`\`

### 2. Add Tasks
\`\`\`
createTask --projectId "uuid" --title "Design mockups" --priority "high"
createTask --projectId "uuid" --title "Implement header" --priority "medium"
\`\`\`

### 3. Track Progress
\`\`\`
moveTask --taskId "uuid" --status "in_progress"
moveTask --taskId "uuid" --status "done"
\`\`\`
`,
      },
      {
        path: 'references/task-states.md',
        content: `# Task States

## Status Values

| Status | Description |
|--------|-------------|
| backlog | Not yet scheduled |
| todo | Ready to start |
| in_progress | Currently being worked on |
| review | Ready for review |
| done | Completed |

## Priority Values

| Priority | When to Use |
|----------|-------------|
| low | Nice to have, no deadline |
| medium | Standard work items |
| high | Important, needs attention soon |
| urgent | Critical, needs immediate attention |

## State Transitions

Typical flow:
\`\`\`
backlog → todo → in_progress → review → done
\`\`\`

Tasks can move backwards if needed (e.g., review → in_progress for revisions).
`,
      },
      {
        path: 'references/workflow.md',
        content: `# Project Workflow

## Starting a New Project

1. **Create the project** with a clear title and summary
2. **Break down work** into individual tasks
3. **Prioritize tasks** (urgent → high → medium → low)
4. **Move tasks through states** as work progresses

## Task Best Practices

- **One task per unit of work**: Keep tasks focused and achievable
- **Clear titles**: Should describe what needs to be done
- **Add descriptions**: Include context, acceptance criteria
- **Link documents**: Attach relevant artifacts to tasks

## Daily Workflow

1. Check tasks in "todo" status
2. Move task to "in_progress" when starting
3. Move to "review" when ready for feedback
4. Move to "done" when complete
`,
      },
    ],
  },

  // =============================================================================
  // AGENT MANAGEMENT SKILL
  // =============================================================================
  {
    key: 'agent-management',
    name: 'Agent Management',
    description: 'List, configure, and spawn other agents',
    files: [
      {
        path: 'SKILL.md',
        content: `# Agent Management Skill

Manage and interact with other agents in the system.

## Available Tools

- **listAgents**: List all available agents
- **getAgent**: Get detailed info about an agent
- **updateAgent**: Update agent configuration
- **setAgentEnabled**: Enable or disable an agent
- **toggleAgentFavorite**: Mark agent as favorite
- **spawnAgent**: Spawn another agent to handle a subtask

## Listing Agents
\`\`\`
listAgents
listAgents --type "server" --includeDisabled true
\`\`\`

## Spawning Agents

Use spawnAgent to delegate tasks to specialized agents:
\`\`\`
spawnAgent --agentId "researcher" --message "Research the latest React 19 features"
\`\`\`

### When to Spawn

- Task requires specialized knowledge
- Need parallel processing
- Want a fresh context for a subtask
- Delegating to domain experts

### Spawn Best Practices

- Provide clear, complete instructions
- Include all necessary context in the message
- Spawned agents don't have your conversation history
`,
      },
    ],
  },

  // =============================================================================
  // UTILITIES SKILL
  // =============================================================================
  {
    key: 'utilities',
    name: 'Utilities',
    description: 'General utilities like time and UI navigation',
    files: [
      {
        path: 'SKILL.md',
        content: `# Utilities Skill

General-purpose utilities for time and UI interaction.

## Available Tools

- **getTime**: Get current date and time
- **navigateTo**: Navigate the user's browser to a path
- **getCurrentUIState**: Get current page info

## Time Operations
\`\`\`
getTime
getTime --timezone "America/New_York"
\`\`\`

## Navigation

Navigate the user to specific pages:
\`\`\`
navigateTo --path "/app/projects"
navigateTo --path "/app/artifacts"
navigateTo --path "/app/agents"
\`\`\`

## UI State

Check what page the user is currently viewing:
\`\`\`
getCurrentUIState
\`\`\`

Returns current path, page title, and route parameters.
`,
      },
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all skills as lightweight metadata (for system prompt / discovery)
 */
export function getSkillsMetadata(): SkillMetadata[] {
  return SKILLS.map((skill) => ({
    key: skill.key,
    name: skill.name,
    description: skill.description,
    availableFiles: skill.files.map((f) => f.path),
  }));
}

/**
 * Get a skill by its key
 */
export function getSkillByKey(key: string): SkillDefinition | undefined {
  return SKILLS.find((s) => s.key === key);
}

/**
 * Get all skill keys
 */
export function getSkillKeys(): string[] {
  return SKILLS.map((s) => s.key);
}

/**
 * Search within a skill's files
 */
export function searchSkillFiles(
  skill: SkillDefinition,
  query: string
): Array<{ path: string; matches: string[] }> {
  const results: Array<{ path: string; matches: string[] }> = [];
  const queryLower = query.toLowerCase();

  for (const file of skill.files) {
    const lines = file.content.split('\n');
    const matches: string[] = [];

    for (const line of lines) {
      if (line.toLowerCase().includes(queryLower)) {
        matches.push(line.trim());
      }
    }

    if (matches.length > 0) {
      results.push({ path: file.path, matches });
    }
  }

  return results;
}

export * from './types';
