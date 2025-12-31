# Agent Kit Monorepo

Test

A Bun monorepo containing a React UI library, Fastify server, and Vite React application.

## Structure

- `packages/ui` - React component library with Storybook
- `apps/server` - Fastify HTTP server
- `apps/web` - Vite React application

## Prerequisites

- [Bun](https://bun.sh/) >= 1.2.0

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

Run all packages in development mode:

```bash
bun run dev
```

Or run individual packages:

```bash
bun run dev:web        # Vite React app (port 5173)
bun run dev:server     # Fastify server (port 3000)
bun run dev:storybook  # Storybook (port 6006)
```

### Build

Build all packages:

```bash
bun run build
```

### Linting & Formatting

```bash
bun run lint          # Run ESLint
bun run lint:fix      # Fix ESLint errors
bun run format        # Format with Prettier
bun run format:check  # Check formatting
```

### Type Checking

```bash
bun run typecheck
```

## Package Scripts

| Script            | Description                      |
| ----------------- | -------------------------------- |
| `dev`             | Run all packages in dev mode     |
| `dev:web`         | Run Vite React app               |
| `dev:server`      | Run Fastify server               |
| `dev:storybook`   | Run Storybook                    |
| `build`           | Build all packages               |
| `build:ui`        | Build UI library                 |
| `build:web`       | Build web app                    |
| `build:server`    | Build server                     |
| `build:storybook` | Build Storybook static site      |
| `lint`            | Run ESLint                       |
| `lint:fix`        | Run ESLint with auto-fix         |
| `format`          | Format all files with Prettier   |
| `format:check`    | Check Prettier formatting        |
| `typecheck`       | Run TypeScript type checking     |
| `clean`           | Remove all node_modules and dist |

## Adding Dependencies

To add a dependency to a specific package:

```bash
bun add <package-name> --cwd packages/ui
bun add <package-name> --cwd apps/web
bun add <package-name> --cwd apps/server
```

## Using UI Components in Web App

Import components from the UI library:

```tsx
import { Button } from '@agent-kit/ui';

function App() {
  return <Button variant="primary">Click me</Button>;
}
```
