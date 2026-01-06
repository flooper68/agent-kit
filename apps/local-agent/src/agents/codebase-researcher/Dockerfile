FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/local-agent/package.json ./apps/local-agent/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY apps/local-agent/ ./apps/local-agent/

# Build the codebase researcher agent
WORKDIR /app/apps/local-agent
RUN bun build src/agents/codebase-researcher/index.ts --compile --outfile dist/codebase-researcher --minify

# Runtime image
FROM debian:bookworm-slim

# Install ca-certificates for HTTPS requests
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/local-agent/dist/codebase-researcher /usr/local/bin/

# Default working directory for file operations
WORKDIR /workspace

ENV SERVER_URL=ws://host.docker.internal:3001
ENV WORKING_DIRECTORY=/workspace

ENTRYPOINT ["codebase-researcher"]
