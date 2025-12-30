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

### Branch Strategy

- **Never commit directly to main** - Always create a feature branch
- **Branch naming**: `feat/<description>` (e.g., `feat/add-login`, `feat/improve-performance`)

### Before Pushing

Run all quality checks before pushing to ensure clean PRs:

```bash
bun run lint          # Check for lint errors
bun run format:check  # Verify formatting
bun run typecheck     # TypeScript type checking
bun run build         # Build all packages
```

All checks must pass before pushing.

### Creating/Updating PRs

When a logical unit of work is complete:

1. **Create branch** (if not already on a feature branch):

   ```bash
   git checkout -b feat/<description>
   ```

2. **Run quality checks** (all must pass):

   ```bash
   bun run lint && bun run format:check && bun run typecheck && bun run build
   ```

3. **Commit and push**:

   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push -u origin feat/<description>
   ```

4. **Create or update PR**:

   ```bash
   # Check if PR exists
   gh pr view

   # If no PR exists, create one
   gh pr create --fill

   # If PR exists, push updates (PR auto-updates)
   git push
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

- "🤖 Generated with Claude Code" or similar footers
- "Co-Authored-By: Claude" or any AI co-author attribution
