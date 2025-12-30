# Agent Kit

Bun monorepo with React web app, Fastify server, and shared UI components.

## Structure

- `apps/web` - Vite + React frontend (`@agent-kit/web`)
- `apps/server` - Fastify server on Bun runtime (`@agent-kit/server`)
- `packages/ui` - Shared React components with Storybook (`@agent-kit/ui`)

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Run all apps in dev mode
bun run dev:web          # Run web app only
bun run dev:server       # Run server only
bun run dev:storybook    # Run Storybook
bun run build            # Build all packages
bun run lint             # Run ESLint
bun run lint:fix         # Fix lint errors
bun run format           # Format with Prettier
bun run format:check     # Check formatting
bun run typecheck        # TypeScript type checking
```

## TypeScript

- **Strict mode** enabled
- **ES2022** target
- **ES modules** - use `import`/`export`
- **noUncheckedIndexedAccess** - array/object index access may return `undefined`

```typescript
// Array access returns T | undefined
const items = ['a', 'b'];
const first = items[0]; // string | undefined - check before using

// Object index access returns T | undefined
const map: Record<string, number> = {};
const value = map['key']; // number | undefined
```

## Monorepo

Import shared UI components:

```typescript
import { Button } from '@agent-kit/ui';
```

Workspace dependencies use `workspace:*` protocol in package.json.

Run commands for specific packages:

```bash
bun run --cwd apps/web dev
bun run --cwd packages/ui build
```

## Code Style

- **Prettier** for formatting
- **ESLint** for linting (TypeScript + React rules)
- Unused vars prefixed with `_` are allowed
- React: no need to import React for JSX

## Git Workflow

**IMPORTANT**: Always follow this workflow when making code changes.

### Session Start - Create Worktree

At the start of each task, create a new worktree:

```bash
# From main repo, create worktree with new branch
git worktree add .worktrees/feat-<description> -b feat/<description>
cd .worktrees/feat-<description>
bun install
```

### Branch Naming

- **Branch**: `feat/<description>` (e.g., `feat/add-login`)
- **Worktree path**: `.worktrees/feat-<description>`

### Development

Work entirely within the worktree directory. Main repo stays on `main`.

### Before Pushing

Run all quality checks:

```bash
bun run lint && bun run format:check && bun run typecheck && bun run build
```

All checks must pass before pushing.

### Commit, Push, and PR

```bash
git add .
git commit -m "feat: description of changes"
git push -u origin feat/<description>
gh pr create --fill
```

### Merging PRs

Always use **squash merge** for PRs:

```bash
gh pr merge --squash
```

### Cleanup (After PR Merged)

After the PR is merged, ask the user if they want to clean up:

```bash
# Return to main repo
cd /path/to/agent-kit

# Remove worktree and branch
git worktree remove .worktrees/feat-<description>
git branch -d feat/<description>
```

### Commit Messages

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

**Do NOT include**:

- AI attribution footers or co-author lines
