# Local Agents

Multi-agent system for connecting specialized agents to the Agent Kit server. Each agent type has different capabilities and tools.

## Available Agents

| Agent                                                             | Purpose                       | Tools                          |
| ----------------------------------------------------------------- | ----------------------------- | ------------------------------ |
| [codebase-researcher](./src/agents/codebase-researcher/README.md) | Explore and analyze codebases | Read, Glob, Grep               |
| [web-researcher](./src/agents/web-researcher/README.md)           | Research topics from the web  | WebFetch, WebSearch            |
| [mock-agent](./src/agents/mock-agent/README.md)                   | Testing and demos             | MockRead, MockSearch, MockGrep |

## Architecture

```
apps/local-agent/
└── src/
    ├── lib/                          # Shared library code
    │   ├── client.ts                 # WebSocket client
    │   ├── message-handler.ts        # Message routing
    │   ├── handlers/                 # Handler registry
    │   ├── types.ts                  # Type definitions
    │   └── logger.ts                 # Logging utility
    │
    └── agents/                       # Individual agent implementations
        ├── codebase-researcher/
        ├── web-researcher/
        └── mock-agent/
```

## Quick Start

```bash
# Set required environment variable
export AGENT_API_KEY=your_api_key_here

# Run an agent in development mode
bun run dev:codebase-researcher
bun run dev:web-researcher
bun run dev:mock-agent
```

## Environment Variables

All agents share these common environment variables:

| Variable        | Required | Default               | Description                              |
| --------------- | -------- | --------------------- | ---------------------------------------- |
| `SERVER_URL`    | No       | `ws://localhost:3001` | WebSocket server URL                     |
| `AGENT_API_KEY` | **Yes**  | -                     | Secret API key from local agent creation |
| `AGENT_ID`      | No       | -                     | Optional identifier for logging          |

See each agent's README for agent-specific configuration options.

## Development

```bash
# Run specific agent with auto-reload
bun run dev:codebase-researcher
bun run dev:web-researcher
bun run dev:mock-agent
```

## Build

```bash
# Build all agents
bun run build

# Build specific agent
bun run build:codebase-researcher
bun run build:web-researcher
bun run build:mock-agent
```

Compiled binaries are output to `dist/`.

## Docker

### Docker Compose (Recommended)

The easiest way to run agents is via Docker Compose:

```bash
cd apps/local-agent

# Copy env template and configure
cp .env.example .env
# Edit .env with your settings

# Build and run all agents
docker compose build
docker compose up
```

### Prerequisites

The Docker setup requires these files on your host machine:

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth authentication                          |
| `~/.gitconfig`                | Git configuration (codebase-researcher only)         |
| `~/.config/gh/`               | GitHub CLI authentication (codebase-researcher only) |

To set up Claude credentials, run `claude` locally and complete OAuth login.

### Container Architecture

All agent containers:

- Run as non-root `agent` user for security
- Use Bun 1.3.5 for building
- Install Claude Code CLI via native installer
- Use `debian:bookworm-slim` as runtime base

### Environment Variables

Configure via `.env` file or environment:

**Codebase Researcher:**

```bash
CODEBASE_RESEARCHER_AGENT_API_KEY=your_key
CODEBASE_RESEARCHER_AGENT_ID=codebase-researcher
CODEBASE_RESEARCHER_GIT_REPOSITORY_URL=https://github.com/user/repo.git
CODEBASE_RESEARCHER_GIT_BRANCH=main  # optional
CODEBASE_RESEARCHER_MODEL=claude-sonnet-4-5
```

**Web Researcher:**

```bash
WEB_RESEARCHER_AGENT_API_KEY=your_key
WEB_RESEARCHER_AGENT_ID=web-researcher
WEB_RESEARCHER_MODEL=claude-sonnet-4-5
WEB_RESEARCHER_HTTP_PROXY=http://proxy:8080  # optional
```

**Claude CLI:**

```bash
CLAUDE_CLI_AGENT_API_KEY=your_key
CLAUDE_CLI_AGENT_ID=claude-cli
CLAUDE_CLI_WORKSPACE=./workspace
ANTHROPIC_API_KEY=your_anthropic_key  # or use OAuth
```

### Volume Mounts

| Container           | Mount                         | Purpose           |
| ------------------- | ----------------------------- | ----------------- |
| All agents          | `~/.claude/.credentials.json` | Claude OAuth      |
| codebase-researcher | `~/.gitconfig`                | Git config        |
| codebase-researcher | `~/.config/gh/`               | GitHub CLI auth   |
| claude-cli          | `./workspace:/workspace`      | Working directory |

### Resource Limits

The `claude-cli` container has resource limits:

- Memory: 4GB
- CPUs: 2.0
- Security: `no-new-privileges`

### Building Individual Images

```bash
# Build from monorepo root with correct context
docker build -f apps/local-agent/src/agents/codebase-researcher/Dockerfile -t codebase-researcher .
docker build -f apps/local-agent/src/agents/web-researcher/Dockerfile -t web-researcher .
docker build -f apps/local-agent/src/agents/claude-cli/Dockerfile -t claude-cli .
docker build -f apps/local-agent/src/agents/mock-agent/Dockerfile -t mock-agent .
```

## Creating New Agents

To add a new agent type:

1. Create a new directory under `src/agents/`:

   ```
   src/agents/my-agent/
   ├── index.ts      # Entry point
   ├── env.ts        # Environment configuration
   ├── handler.ts    # Agent handler implementation
   ├── Dockerfile    # Container configuration
   └── README.md     # Documentation
   ```

2. Implement the `AgentHandler` interface in `handler.ts`:

   ```typescript
   import type {
     AgentHandler,
     AgentRunParams,
     AgentRunResult,
     StreamEvent,
   } from '../../lib';

   export class MyAgentHandler implements AgentHandler {
     readonly id = 'my-agent';

     async *run(
       params: AgentRunParams
     ): AsyncGenerator<StreamEvent, AgentRunResult> {
       // Implement your agent logic here
     }
   }
   ```

3. Register your handler in `index.ts`:

   ```typescript
   import { registerHandler, LocalAgentClient } from '../../lib';
   import { MyAgentHandler } from './handler';

   registerHandler('my-agent', (config) => new MyAgentHandler(config));
   ```

4. Add scripts to `package.json`:
   ```json
   {
     "dev:my-agent": "bun run --watch src/agents/my-agent/index.ts",
     "build:my-agent": "bun build src/agents/my-agent/index.ts --compile --outfile dist/my-agent --minify"
   }
   ```
