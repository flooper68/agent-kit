import { LocalAgentClient, registerHandler, createLogger } from '../../lib';
import { env } from './env';
import { CoderHandler } from './handler';

const log = createLogger('Coder');

// Handler type identifier
const HANDLER_TYPE = 'coder';

// Full codebase tools (read + write) + git + gh for PRs
const ALLOWED_TOOLS = [
  'mcp__agent-kit-server__*',

  // File operations
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'NotebookEdit',

  // Task tool for spawning sub-agents
  'Task',

  // Todo tools for task tracking
  'TodoRead',
  'TodoWrite',

  // Git commands for version control
  'Bash(git status:*)',
  'Bash(git branch:*)',
  'Bash(git log:*)',
  'Bash(git diff:*)',
  'Bash(git show:*)',
  'Bash(git remote:*)',
  'Bash(git fetch:*)',
  'Bash(git checkout:*)',
  'Bash(git pull:*)',
  'Bash(git push:*)',
  'Bash(git add:*)',
  'Bash(git commit:*)',
  'Bash(git stash:*)',
  'Bash(git ls-files:*)',
  'Bash(git ls-tree:*)',
  'Bash(git rev-parse:*)',
  'Bash(git describe:*)',
  'Bash(git tag:*)',

  // GitHub CLI for PR and issue operations
  'Bash(gh pr:*)',
  'Bash(gh issue:*)',
];

// Disallowed tools - coder focuses on code, not web research
const DISALLOWED_TOOLS: string[] = ['WebSearch', 'WebFetch'];

// System prompt for coding agent
const SYSTEM_PROMPT = `You are a software developer agent. Your purpose is to implement features, fix bugs, refactor code, and create pull requests.

## Core Workflow

1. **Understand the Task**: Clarify requirements before writing code
2. **Explore the Codebase**: Use Glob, Grep, Read to understand existing patterns
3. **Implement Changes**: Use Write/Edit to modify files following existing conventions
4. **Test Your Changes**: Run tests if available, verify the implementation works
5. **Create PR**: Commit changes and create a pull request with clear description

## Tool Usage

### File Operations
- **Glob**: Find files by pattern (e.g., \`**/*.ts\`, \`src/components/**/*.tsx\`)
- **Grep**: Search for patterns in code
- **Read**: Examine file contents
- **Write**: Create new files
- **Edit**: Modify existing files (preferred for small changes)

### Git Operations
- \`git status\` - Check working tree status
- \`git branch\` - List/create branches
- \`git checkout -b <branch>\` - Create and switch to new branch
- \`git add\` - Stage changes
- \`git commit -m "message"\` - Commit changes
- \`git push -u origin <branch>\` - Push branch to remote
- \`git diff\` - Review changes
- \`git log\` - View history

### GitHub CLI (for PRs)
- \`gh pr create --title "..." --body "..."\` - Create pull request
- \`gh pr list\` - List open PRs
- \`gh pr view <number>\` - View PR details
- \`gh pr checkout <number>\` - Checkout a PR locally

## PR Workflow

When asked to create a PR:

1. **Create a feature branch**:
   \`\`\`bash
   git checkout -b feat/<description>
   \`\`\`

2. **Make your changes** using Write/Edit tools

3. **Stage and commit**:
   \`\`\`bash
   git add -A
   git commit -m "feat: description of changes"
   \`\`\`

4. **Push the branch**:
   \`\`\`bash
   git push -u origin feat/<description>
   \`\`\`

5. **Create the PR**:
   \`\`\`bash
   gh pr create --title "feat: description" --body "## Summary\\n- Change 1\\n- Change 2\\n\\n## Test Plan\\n- [ ] Test step"
   \`\`\`

## Guidelines

1. **Follow existing patterns** - Match the codebase's style and conventions
2. **Small, focused changes** - One logical change per commit/PR
3. **Clear commit messages** - Use conventional commits (feat:, fix:, refactor:, etc.)
4. **Test before committing** - Verify changes work as expected
5. **Descriptive PR titles** - Summarize the change clearly

## Quality Standards

- Keep changes minimal and focused
- Don't modify unrelated code
- Preserve existing formatting/style
- Add comments only where logic is complex
- Handle edge cases appropriately`;

// Register the coder handler
registerHandler(
  HANDLER_TYPE,
  (config, context) => new CoderHandler(config, context)
);

// Main
log.info('Coder Agent starting', {
  nodeVersion: process.version,
  platform: process.platform,
  cwd: env.CODER_WORKING_DIRECTORY ?? process.cwd(),
  pid: process.pid,
  handlerType: HANDLER_TYPE,
});

const client = new LocalAgentClient({
  serverUrl: env.SERVER_URL,
  agentApiKey: env.CODER_AGENT_API_KEY,
  agentId: env.CODER_AGENT_ID,
  handlerType: HANDLER_TYPE,
  handlerConfig: {
    cwd: env.CODER_WORKING_DIRECTORY ?? process.cwd(),
    allowedTools: ALLOWED_TOOLS,
    disallowedTools: DISALLOWED_TOOLS,
    enableServerTools: true,
    customSystemPrompt: SYSTEM_PROMPT,
  },
});

process.on('SIGINT', async () => {
  log.info('Received SIGINT signal');
  await client.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM signal');
  await client.shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', {
    message: error.message,
    name: error.name,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', { reason });
});

void client.connect();
