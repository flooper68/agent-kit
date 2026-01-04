# Agent Kit Monorepo

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

## Authentication & Multitenancy

Agent Kit uses [Clerk](https://clerk.com) for authentication with a multi-tenant architecture based on Organizations.

### How It Works

- **Users** authenticate via Clerk (email/password or OAuth)
- **Organizations** represent projects/tenants - each user can belong to multiple organizations
- **Role-based access** with `org:admin` and `org:member` roles
- **Tenant isolation** - all data (sessions, artifacts) is scoped by `orgId`

### Key Features

| Feature                | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| JWT Authentication     | Tokens verified on backend via `@clerk/backend`                                       |
| Organization Switching | Users can switch between organizations in the UI                                      |
| Role-Based Procedures  | tRPC procedures enforce auth (`protectedProcedure`, `orgProcedure`, `adminProcedure`) |
| WebSocket Auth         | Real-time connections authenticated via connection params                             |
| Tenant Isolation       | Database queries filter by `orgId` to prevent cross-tenant access                     |

### Required Environment Variables

**Backend (`apps/server/.env`):**

```bash
CLERK_SECRET_KEY=sk_test_...      # Backend JWT verification
CLERK_PUBLISHABLE_KEY=pk_test_... # Clerk API calls
```

**Frontend (`apps/web/.env`):**

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

For detailed setup instructions, see [docs/clerk-setup.md](./docs/clerk-setup.md).
