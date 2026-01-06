# Mock Agent

A local agent for testing and demonstrations. It simulates the full event stream (thinking, tool calls, responses) without calling any AI service.

## Purpose

This agent is useful for:

- **Testing**: Verify WebSocket connectivity and event handling without AI costs
- **Demos**: Show how the system works without API keys
- **Development**: Debug UI and event processing without waiting for AI responses
- **CI/CD**: Run integration tests with predictable, fast responses

## Simulated Flow

The mock agent simulates the following event sequence:

1. `message_start` - Signals response is beginning
2. `reasoning_delta` (if enabled) - Simulated thinking process
3. `text_delta` - Initial response text
4. `tool_call_start` + `tool_result` - Simulated tool calls (configurable count)
5. `reasoning_delta` (if enabled) - Post-tool thinking
6. `text_delta` - Final response text
7. `message_complete` - Signals response is complete with mock usage stats

## Mock Tools

This agent uses mock-prefixed tool names to clearly distinguish from real tools:

- **MockRead**: Simulates file reading
- **MockSearch**: Simulates web search
- **MockGrep**: Simulates content search

## Environment Variables

| Variable                | Required | Default               | Description                              |
| ----------------------- | -------- | --------------------- | ---------------------------------------- |
| `SERVER_URL`            | No       | `ws://localhost:3001` | WebSocket server URL                     |
| `AGENT_API_KEY`         | **Yes**  | -                     | Secret API key from local agent creation |
| `AGENT_ID`              | No       | -                     | Optional identifier for logging          |
| `MOCK_DELAY_MS`         | No       | `100`                 | Delay between events in milliseconds     |
| `MOCK_THINKING_ENABLED` | No       | `true`                | Enable reasoning/thinking events         |
| `MOCK_TOOL_CALLS`       | No       | `2`                   | Number of tool calls to simulate         |

## Running Locally

```bash
# From the local-agent directory
cd apps/local-agent

# Set required environment variables
export AGENT_API_KEY=your_api_key_here

# Optional: Customize mock behavior
export MOCK_DELAY_MS=50          # Faster responses
export MOCK_THINKING_ENABLED=false  # Skip thinking events
export MOCK_TOOL_CALLS=1         # Single tool call

# Run in development mode
bun run dev:mock-agent
```

## Running with Docker

```bash
# Build the image
docker build -f agents/mock-agent/Dockerfile -t mock-agent ../../..

# Run with default settings
docker run -it \
  -e AGENT_API_KEY=your_api_key_here \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  mock-agent

# Run with custom settings
docker run -it \
  -e AGENT_API_KEY=your_api_key_here \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -e MOCK_DELAY_MS=50 \
  -e MOCK_TOOL_CALLS=3 \
  mock-agent
```

## Testing Interrupts

The mock agent properly handles abort signals. You can test interrupt functionality by sending an interrupt request while the agent is processing - it will immediately emit an `interrupted` event and stop.
