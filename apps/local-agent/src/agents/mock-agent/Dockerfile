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
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source
COPY apps/local-agent/ ./apps/local-agent/
COPY apps/server/ ./apps/server/
COPY apps/storybook/ ./apps/storybook/
COPY apps/web/ ./apps/web/
COPY packages/auth/ ./packages/auth/
COPY packages/shared/ ./packages/shared/
COPY packages/ui/ ./packages/ui/

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
