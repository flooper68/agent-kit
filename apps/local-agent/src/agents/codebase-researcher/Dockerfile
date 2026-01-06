FROM oven/bun:1.3.5 AS builder
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./

# Copy all workspace package.json files
COPY apps/local-agent/package.json ./apps/local-agent/
COPY apps/server/package.json ./apps/server/
COPY apps/storybook/package.json ./apps/storybook/
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source
COPY apps/local-agent/ ./apps/local-agent/
COPY apps/server/ ./apps/server/
COPY apps/storybook/ ./apps/storybook/
COPY apps/web/ ./apps/web/
COPY packages/auth/ ./packages/auth/
COPY packages/ui/ ./packages/ui/

# Build the codebase researcher agent
WORKDIR /app/apps/local-agent
RUN bun build src/agents/codebase-researcher/index.ts --compile --outfile dist/codebase-researcher --minify

# Runtime image
FROM debian:bookworm-slim

# Install ca-certificates, curl, git for HTTPS requests and repository operations
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and setup directories
RUN useradd -m -s /bin/bash agent && \
    mkdir -p /home/agent/.claude && \
    chown -R agent:agent /home/agent

# Install Claude Code CLI via native installer (as agent user)
USER agent
RUN curl -fsSL https://claude.ai/install.sh | bash
USER root

COPY --from=builder /app/apps/local-agent/dist/codebase-researcher /usr/local/bin/
COPY --chmod=755 apps/local-agent/src/agents/codebase-researcher/entrypoint.sh /usr/local/bin/

# Default working directory for file operations
WORKDIR /workspace
RUN chown agent:agent /workspace

USER agent

ENV SERVER_URL=ws://host.docker.internal:3001
ENV WORKING_DIRECTORY=/workspace
ENV CLAUDE_CODE_PATH=/home/agent/.local/bin/claude

ENTRYPOINT ["entrypoint.sh"]
