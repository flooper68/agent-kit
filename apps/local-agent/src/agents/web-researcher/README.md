# Web Researcher Agent

A local agent specialized for web research. It searches the web, fetches content from relevant sources, and synthesizes findings into well-structured artifacts with proper citations.

## How It Works

1. **Plan**: Creates a todo list with concrete research steps
2. **Search**: Uses WebSearch to find relevant sources for your query
3. **Fetch**: Retrieves content from the most promising URLs (typically 2-4 sources)
4. **Synthesize**: Creates a structured artifact with findings and source citations

## Output Format

All research results are saved as artifacts with:

- **Summary**: Brief overview of findings
- **Key Findings**: Main points organized by topic
- **Details**: Relevant excerpts (not raw dumps)
- **Sources**: List of all URLs with descriptions

## Tools

- **WebSearch**: Search the web using search engines
- **WebFetch**: Fetch and parse web page contents
- **writeArtifact**: Save research findings to the server

## Environment Variables

| Variable                      | Required | Default               | Description              |
| ----------------------------- | -------- | --------------------- | ------------------------ |
| `WEB_RESEARCHER_AGENT_API_KEY`| **Yes**  | -                     | Secret API key           |
| `SERVER_URL`                  | No       | `ws://localhost:3001` | WebSocket server URL     |
| `WEB_RESEARCHER_AGENT_ID`     | No       | -                     | Agent ID for logging     |

## Running Locally

```bash
cd apps/local-agent
export WEB_RESEARCHER_AGENT_API_KEY=your_key
bun run dev:web-researcher
```

## Running with Docker

### Docker Compose (Recommended)

```bash
cd apps/local-agent

# Configure environment
cat >> .env << EOF
SERVER_URL=ws://host.docker.internal:3001
WEB_RESEARCHER_AGENT_API_KEY=your_key
EOF

# Build and run
docker compose build web-researcher
docker compose up web-researcher
```

### Docker (Manual)

```bash
# Build from monorepo root
docker build -f apps/local-agent/src/agents/web-researcher/Dockerfile -t web-researcher .

# Run with required mounts
docker run -it \
  -e WEB_RESEARCHER_AGENT_API_KEY=your_key \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v ~/.claude/.credentials.json:/home/agent/.claude/.credentials.json:ro \
  web-researcher
```

### Required Host Files

For Docker, these files must exist on the host:

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth (run `claude` locally first) |

## Use Cases

- Research topics and synthesize findings from multiple sources
- Find and summarize documentation, articles, and reference materials
- Compare different sources and perspectives on a topic
- Fact-check information using multiple sources
- Create research reports with proper citations
