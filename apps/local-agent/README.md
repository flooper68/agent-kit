# Local Agents

Multi-agent system for connecting specialized agents to the Agent Kit server. Each agent type has different capabilities and tools.

## Available Agents

| Agent                                                                   | Purpose                        | Tools                       |
| ----------------------------------------------------------------------- | ------------------------------ | --------------------------- |
| [codebase-researcher](./src/agents/codebase-researcher/README.md)       | Explore and analyze codebases  | Read, Glob, Grep, Git       |
| [coder](./src/agents/coder/README.md)                                   | Implement features, create PRs | Read, Write, Edit, Git, gh  |
| [web-researcher](./src/agents/web-researcher/README.md)                 | Research topics from the web   | WebFetch, WebSearch         |
| [claude-assistant-opus](./src/agents/claude-assistant-opus/README.md)   | Planning and brainstorming     | MCP server tools, Web       |
| [claude-assistant-sonnet](./src/agents/claude-assistant-sonnet/README.md) | Planning and brainstorming   | MCP server tools, Web       |

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
        ├── coder/
        ├── web-researcher/
        ├── claude-assistant-opus/
        └── claude-assistant-sonnet/
```

## Quick Start

```bash
# Run an agent in development mode (set env vars first - see each agent's README)
bun run dev:codebase-researcher
bun run dev:coder
bun run dev:web-researcher
bun run dev:claude-assistant-opus
bun run dev:claude-assistant-sonnet
```

## Environment Variables

Each agent uses prefixed environment variables. See each agent's README for specific configuration:

| Agent                  | API Key Variable                        | Agent ID Variable                   |
| ---------------------- | --------------------------------------- | ----------------------------------- |
| codebase-researcher    | `CODEBASE_RESEARCHER_AGENT_API_KEY`     | `CODEBASE_RESEARCHER_AGENT_ID`      |
| coder                  | `CODER_AGENT_API_KEY`                   | `CODER_AGENT_ID`                    |
| web-researcher         | `WEB_RESEARCHER_AGENT_API_KEY`          | `WEB_RESEARCHER_AGENT_ID`           |
| claude-assistant-opus  | `CLAUDE_ASSISTANT_OPUS_AGENT_API_KEY`   | `CLAUDE_ASSISTANT_OPUS_AGENT_ID`    |
| claude-assistant-sonnet| `CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY` | `CLAUDE_ASSISTANT_SONNET_AGENT_ID`  |

Common variable: `SERVER_URL` (default: `ws://localhost:3001`)

## Development

```bash
# Run specific agent with auto-reload
bun run dev:codebase-researcher
bun run dev:coder
bun run dev:web-researcher
bun run dev:claude-assistant-opus
bun run dev:claude-assistant-sonnet
```

## Build

```bash
# Build all agents
bun run build

# Build specific agent
bun run build:codebase-researcher
bun run build:coder
bun run build:web-researcher
bun run build:claude-assistant-opus
bun run build:claude-assistant-sonnet
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

| File                          | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth authentication                               |
| `~/.gitconfig`                | Git configuration (codebase-researcher, coder)            |
| `~/.config/gh/`               | GitHub CLI authentication (codebase-researcher, coder)    |

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
```

**Coder:**

```bash
CODER_AGENT_API_KEY=your_key
CODER_AGENT_ID=coder
CODER_GIT_REPOSITORY_URL=https://github.com/user/repo.git
CODER_GIT_BRANCH=main  # optional
```

**Web Researcher:**

```bash
WEB_RESEARCHER_AGENT_API_KEY=your_key
WEB_RESEARCHER_AGENT_ID=web-researcher
```

**Claude Assistant (Opus/Sonnet):**

```bash
CLAUDE_ASSISTANT_OPUS_AGENT_API_KEY=your_key
CLAUDE_ASSISTANT_OPUS_AGENT_ID=claude-assistant-opus
CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY=your_key
CLAUDE_ASSISTANT_SONNET_AGENT_ID=claude-assistant-sonnet
```

### Volume Mounts

| Container                    | Mount                         | Purpose           |
| ---------------------------- | ----------------------------- | ----------------- |
| All agents                   | `~/.claude/.credentials.json` | Claude OAuth      |
| codebase-researcher, coder   | `~/.gitconfig`                | Git config        |
| codebase-researcher, coder   | `~/.config/gh/`               | GitHub CLI auth   |

### Resource Limits

The `claude-cli` container has resource limits:

- Memory: 4GB
- CPUs: 2.0
- Security: `no-new-privileges`

### Building Individual Images

```bash
# Build from monorepo root with correct context
docker build -f apps/local-agent/src/agents/codebase-researcher/Dockerfile -t codebase-researcher .
docker build -f apps/local-agent/src/agents/coder/Dockerfile -t coder .
docker build -f apps/local-agent/src/agents/web-researcher/Dockerfile -t web-researcher .
docker build -f apps/local-agent/src/agents/claude-assistant-opus/Dockerfile -t claude-assistant-opus .
docker build -f apps/local-agent/src/agents/claude-assistant-sonnet/Dockerfile -t claude-assistant-sonnet .
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
