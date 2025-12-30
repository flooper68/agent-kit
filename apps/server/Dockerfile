# ==============================================================================
# Stage 1: Dependencies
# ==============================================================================
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy all workspace package.json files for lockfile validation
# This maximizes layer caching - dependencies change less often than source code
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# Install only production dependencies for the server
WORKDIR /app/apps/server
RUN bun install --frozen-lockfile --production

# ==============================================================================
# Stage 2: Builder
# ==============================================================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage (Bun hoists to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configs needed for build
COPY apps/server/src ./apps/server/src
COPY apps/server/package.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/
COPY tsconfig.base.json ./

# Build the server
WORKDIR /app/apps/server
RUN bun build src/index.ts --outdir dist --target bun

# ==============================================================================
# Stage 3: Production
# ==============================================================================
FROM oven/bun:1-alpine AS production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

WORKDIR /app

# Copy only the built artifact and production dependencies
COPY --from=builder --chown=bunjs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/apps/server/package.json ./
COPY --from=deps --chown=bunjs:nodejs /app/node_modules ./node_modules

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
