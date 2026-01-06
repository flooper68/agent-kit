# Web Researcher Agent

A local agent specialized for web research. It has access to web tools to search and fetch information from the internet.

## Tools

This agent has access to the following web tools:

- **WebSearch**: Search the web using search engines
- **WebFetch**: Fetch and parse web page contents

## Environment Variables

| Variable        | Required | Default               | Description                              |
| --------------- | -------- | --------------------- | ---------------------------------------- |
| `SERVER_URL`    | No       | `ws://localhost:3001` | WebSocket server URL                     |
| `AGENT_API_KEY` | **Yes**  | -                     | Secret API key from local agent creation |
| `AGENT_ID`      | No       | -                     | Optional identifier for logging          |
| `HTTP_PROXY`    | No       | -                     | HTTP proxy for web requests              |
| `HTTPS_PROXY`   | No       | -                     | HTTPS proxy for web requests             |

## Running Locally

```bash
# From the local-agent directory
cd apps/local-agent

# Set required environment variables
export AGENT_API_KEY=your_api_key_here

# Optional: Set proxy for web requests
export HTTPS_PROXY=http://proxy.example.com:8080

# Run in development mode
bun run dev:web-researcher
```

## Running with Docker

```bash
# Build the image
docker build -f agents/web-researcher/Dockerfile -t web-researcher ../../..

# Run the agent
docker run -it \
  -e AGENT_API_KEY=your_api_key_here \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  web-researcher
```

## Use Cases

- Research topics and gather information
- Find documentation and articles
- Compare different sources
- Summarize web content
- Fact-check information
