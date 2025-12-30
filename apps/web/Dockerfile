# Build context should be the repo root
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Validate required environment variables
RUN if [ -z "$VITE_SERVER_URL" ]; then echo "Error: VITE_SERVER_URL is required" && exit 1; fi && \
    if ! echo "$VITE_SERVER_URL" | grep -qE "^https?://"; then echo "Error: VITE_SERVER_URL must start with http:// or https://" && exit 1; fi

# Copy everything (respects .dockerignore)
COPY . .

# Install dependencies
RUN bun install --frozen-lockfile

# Build UI first, then web
RUN bun run build:ui && bun run build:web

# Production stage - serve static files
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Configure nginx for SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
