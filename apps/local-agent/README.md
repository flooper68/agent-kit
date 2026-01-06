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

Each agent has its own Dockerfile:

```bash
# Build codebase researcher
docker build -f src/agents/codebase-researcher/Dockerfile -t codebase-researcher ../../..

# Build web researcher
docker build -f src/agents/web-researcher/Dockerfile -t web-researcher ../../..

# Build mock agent
docker build -f src/agents/mock-agent/Dockerfile -t mock-agent ../../..
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
