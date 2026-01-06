FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/local-agent/package.json ./apps/local-agent/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY apps/local-agent/ ./apps/local-agent/

# Build the web researcher agent
WORKDIR /app/apps/local-agent
RUN bun build src/agents/web-researcher/index.ts --compile --outfile dist/web-researcher --minify

# Runtime image
FROM debian:bookworm-slim

# Install ca-certificates for HTTPS requests
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/local-agent/dist/web-researcher /usr/local/bin/

WORKDIR /app

ENV SERVER_URL=ws://host.docker.internal:3001

ENTRYPOINT ["web-researcher"]
