# Codebase Researcher Agent

A local agent specialized for exploring and analyzing codebases. It has access to read-only file operations to understand code structure, find patterns, and answer questions about the codebase.

## Tools

This agent has access to the following read-only tools:

- **Read**: Read file contents
- **Glob**: Find files by pattern (e.g., `**/*.ts`)
- **Grep**: Search file contents with regex patterns

## Environment Variables

| Variable            | Required | Default               | Description                              |
| ------------------- | -------- | --------------------- | ---------------------------------------- |
| `SERVER_URL`        | No       | `ws://localhost:3001` | WebSocket server URL                     |
| `AGENT_API_KEY`     | **Yes**  | -                     | Secret API key from local agent creation |
| `AGENT_ID`          | No       | -                     | Optional identifier for logging          |
| `WORKING_DIRECTORY` | No       | Current directory     | Base directory for file operations       |

## Running Locally

```bash
# From the local-agent directory
cd apps/local-agent

# Set required environment variables
export AGENT_API_KEY=your_api_key_here

# Optional: Set working directory to target codebase
export WORKING_DIRECTORY=/path/to/your/codebase

# Run in development mode
bun run dev:codebase-researcher
```

## Running with Docker

```bash
# Build the image
docker build -f agents/codebase-researcher/Dockerfile -t codebase-researcher ../../..

# Run with a mounted codebase
docker run -it \
  -e AGENT_API_KEY=your_api_key_here \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v /path/to/your/codebase:/workspace \
  codebase-researcher
```

## Use Cases

- Explore unfamiliar codebases
- Find all usages of a function or class
- Understand code architecture and patterns
- Search for specific implementations
- Generate code summaries and documentation
