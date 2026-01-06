FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/local-agent/package.json ./apps/local-agent/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY apps/local-agent/ ./apps/local-agent/

# Build the mock agent
WORKDIR /app/apps/local-agent
RUN bun build src/agents/mock-agent/index.ts --compile --outfile dist/mock-agent --minify

# Runtime image - smaller since no Claude SDK
FROM debian:bookworm-slim

COPY --from=builder /app/apps/local-agent/dist/mock-agent /usr/local/bin/

WORKDIR /app

ENV SERVER_URL=ws://host.docker.internal:3001
ENV MOCK_DELAY_MS=100
ENV MOCK_THINKING_ENABLED=true
ENV MOCK_TOOL_CALLS=2

ENTRYPOINT ["mock-agent"]
