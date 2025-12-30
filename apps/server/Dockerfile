# ==============================================================================
# Stage 1: Build
# ==============================================================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy entire repo for build
COPY . .

# Install all dependencies
RUN bun install --frozen-lockfile

# Build the server
WORKDIR /app/apps/server
RUN bun build src/index.ts --outdir dist --target bun

# ==============================================================================
# Stage 2: Production
# ==============================================================================
FROM oven/bun:1-alpine AS production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

WORKDIR /app

# Copy only the built artifact and necessary files
COPY --from=builder --chown=bunjs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/apps/server/package.json ./
COPY --from=builder --chown=bunjs:nodejs /app/apps/server/src/db/migrations ./src/db/migrations

# Install production dependencies only
COPY --from=builder /app/bun.lock ./
RUN bun install --frozen-lockfile --production

# Switch to non-root user
USER bunjs

# Environment variables with defaults
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Health check using the existing /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start the server
CMD ["bun", "run", "dist/index.js"]
