# Claude Assistant Sonnet

A planning and brainstorming assistant powered by Claude Sonnet. Helps users explore ideas, organize projects, and manage tasks within Agent Kit.

## Tools

### Web Research

- **WebSearch**: Search the web for documentation, best practices, current information
- **WebFetch**: Fetch content from specific URLs for analysis

### Task Management

- **TodoRead**: Read current todo list
- **TodoWrite**: Update todo list for tracking progress

### Server Tools (via MCP)

All Agent Kit server tools are available via the `mcp__agent-kit-server__*` pattern:

- Project management (create, update, list projects)
- Task management (create, update, move tasks between columns)
- Artifact management (create, update documents and notes)
- Agent spawning (delegate to specialized agents)
- Skill execution (run registered skills)

## Capabilities

- **Brainstorming**: Break down problems, generate alternatives, identify risks
- **Planning**: Create project plans, define tasks, establish priorities
- **Knowledge organization**: Create and maintain artifacts
- **Workspace navigation**: Help users find and manage their work

## Environment Variables

| Variable                              | Required | Default               | Description              |
| ------------------------------------- | -------- | --------------------- | ------------------------ |
| `CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY` | **Yes**  | -                     | Secret API key           |
| `SERVER_URL`                          | No       | `ws://localhost:3001` | WebSocket server URL     |
| `CLAUDE_ASSISTANT_SONNET_AGENT_ID`    | No       | -                     | Agent ID for logging     |

## Running

### Local

```bash
cd apps/local-agent
export CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY=your_key
bun run dev:claude-assistant-sonnet
```

### Docker Compose (Recommended)

```bash
cd apps/local-agent

# Configure environment
cat >> .env << EOF
SERVER_URL=ws://host.docker.internal:3001
CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY=your_key
EOF

# Build and run
docker compose build claude-assistant-sonnet
docker compose up claude-assistant-sonnet
```

### Docker (Manual)

```bash
# Build from monorepo root
docker build -f apps/local-agent/src/agents/claude-assistant-sonnet/Dockerfile -t claude-assistant-sonnet .

# Run with required mounts
docker run -it \
  -e CLAUDE_ASSISTANT_SONNET_AGENT_API_KEY=your_key \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v ~/.claude/.credentials.json:/home/agent/.claude/.credentials.json:ro \
  claude-assistant-sonnet
```

### Required Host Files

For Docker, this file must exist on the host:

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth (run `claude` locally first) |

## Use Cases

- Project planning and task breakdown
- Brainstorming sessions
- Research and knowledge capture
- Workspace organization
- Decision support and analysis
