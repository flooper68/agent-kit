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
- When creating a migration, there always needs to be a journal file, it is using drizzle orm

## Git Workflow

**IMPORTANT**: Use Graphite for stacked PRs. Work in small, incremental steps. Don't create Drafts, but PRs

### Starting Work

```bash
gt create feat/<description>    # Create new branch in stack
```

### Development Loop

1. Make small, focused changes
2. Run quality checks before committing:
   ```bash
   bun run lint && bun run format:check && bun run typecheck && bun run build
   ```
3. Commit and submit:
   ```bash
   gt commit -m "feat: description"
   gt submit                     # Create/update PR
   ```
4. Continue stacking if needed:
   ```bash
   gt create feat/<next-step>    # Stack another branch
   ```

### Amending Changes

```bash
gt modify                        # Amend current commit
gt submit                        # Update the PR
```

### During Reviews

```bash
gt sync                          # Sync stack with trunk and update PRs
```

### After Approval

```bash
gt merge                         # Merge the stack
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
