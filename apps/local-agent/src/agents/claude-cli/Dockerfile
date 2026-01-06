FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/local-agent/package.json ./apps/local-agent/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY apps/local-agent/ ./apps/local-agent/

# Build the claude-cli agent
WORKDIR /app/apps/local-agent
RUN bun build src/agents/claude-cli/index.ts --compile --outfile dist/claude-cli --minify

# Runtime image
FROM debian:bookworm-slim

# Install ca-certificates, curl, and Node.js (required for Claude CLI)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for Claude CLI)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Copy the built binary
COPY --from=builder /app/apps/local-agent/dist/claude-cli /usr/local/bin/

# Default working directory for file operations
WORKDIR /workspace

ENV SERVER_URL=ws://host.docker.internal:3001
ENV WORKING_DIRECTORY=/workspace
ENV PERMISSION_MODE=dangerously-skip-permissions

ENTRYPOINT ["claude-cli"]
