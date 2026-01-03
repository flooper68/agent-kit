# Agent Kit Server

Fastify server with Redis pub/sub support for agent sessions.

## Prerequisites

- Bun runtime
- Redis 7+ (or use Docker Compose)

## Development

```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:7-alpine

# Set environment
export REDIS_URL=redis://localhost:6379

# Run server
bun run dev
```

## Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f server
```

## Environment Variables

| Variable         | Default       | Description              |
| ---------------- | ------------- | ------------------------ |
| `PORT`           | `3000`        | Server port              |
| `HOST`           | `0.0.0.0`     | Server host              |
| `NODE_ENV`       | `development` | Environment              |
| `REDIS_URL`      | (required)    | Redis connection URL     |
| `TAVILY_API_KEY` | (required)    | Tavily API key for tools |

## Documentation

- [Tools Architecture](docs/tools.md) - How agent tools work and adding new tools
- [Tavily Setup](docs/tavily.md) - Web search API configuration

## Redis Pub/Sub

The server uses Redis pub/sub for real-time agent session communication.

### Architecture

- **Publisher client**: Used for publishing messages
- **Subscriber client**: Dedicated connection for subscriptions (Redis requirement)
- **PubSubManager**: Type-safe wrapper for pub/sub operations

### API Endpoints

| Endpoint               | Method | Description                 |
| ---------------------- | ------ | --------------------------- |
| `/api/pubsub/health`   | GET    | Check Redis connection      |
| `/api/pubsub/publish`  | POST   | Publish a test message      |
| `/api/pubsub/messages` | GET    | View received test messages |

### Usage Example

```typescript
// Subscribe to a channel
await fastify.redis.pubsub.subscribe('agent:session:123', (message) => {
  console.log('Received:', message.data);
});

// Publish to a channel
await fastify.redis.pubsub.publish('agent:session:123', {
  type: 'session_updated',
  data: { ... }
});
```
